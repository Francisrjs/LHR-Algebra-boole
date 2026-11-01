# API HTTP

Base por defecto: http://127.0.0.1:8765. Las operaciones de cálculo usan **POST con cuerpo JSON**, no GET ni parámetros de consulta. No hay endpoints de base de datos, autenticación o escritura arbitraria de archivos.

## Rutas

| Método | Ruta | Uso | Respuesta normal |
|---|---|---|---|
| GET | / | Frontend compilado | 200 HTML; 503 si falta dist |
| GET | /assets/{ruta} | JS, CSS, fuentes locales | 200 recurso; 404 inexistente |
| GET | /api/health | Salud del proceso | 200 {"status":"ok"} |
| POST | /api/analyze | Análisis completo | 200 objeto de análisis |
| POST | /api/algebra | Combinar funciones | 200 {"result": modelo} |
| POST | /api/block-diagram/validate | Validar grafo semántico | 200 {"valid":true,"diagnostics":[]} |
| POST | /api/block-diagram/solve | Resolver transferencias del grafo | 200 matriz de transferencia y ecuaciones de salida |
| POST | /api/edit-roots | Reconstruir una función moviendo una raíz | 200 {"result": modelo} |
| POST | /api/validate-project | Validar proyecto sin guardarlo | 200 {"valid":true} |
| GET | /openapi.json | Contrato generado | 200 JSON |
| GET | /docs | Swagger UI de FastAPI | 200 HTML |
| GET | /redoc | ReDoc | 200 HTML |
| GET, HEAD | /docs/oauth2-redirect | Ruta auxiliar Swagger | HTML; no implica que la app use OAuth |

Los métodos no admitidos devuelven 405. Swagger/ReDoc usan su configuración predeterminada y pueden cargar recursos externos; para trabajar offline consultar el OpenAPI exportado en esta carpeta.

## POST /api/analyze

Ejemplo ejecutable: [analyze.json](ejemplos/analyze.json).

| Campo | Tipo / predeterminado | Significado |
|---|---|---|
| mode | separate o direct; separate | Modo de modelado |
| g,h,l | string; 1/(s+1),1,1/(s+1) | G₀,H,L₀; l se usa en direct |
| k | número finito ≥0; 1 | Ganancia independiente |
| parameters | objeto nombre:número; {} | Valores de parámetros usados en expresiones |
| target | g,h,l,t; l | Transferencia para Bode y estabilidad seleccionada |
| frequency | {min:0.01,max:1000,auto:true} | Configuración de frecuencia |
| temporal | {signal:"step",duration:10,amplitude:1} | Configuración temporal |
| revision | entero; 0 | Identifica la solicitud; se devuelve sin modificar |
| assumeH1 | boolean; false | Supuesto explícito de equivalente unitario en modo directo |

signal admite step, ramp e impulse. Si target no tiene transferencia disponible, el núcleo usa el lazo para el análisis de frecuencia; no inventa G/H/T.

### Estructura de respuesta

- revision: identificador recibido.
- models: g,h,l,l0,t. Cada modelo conocido contiene num,den (coeficientes descendentes), expression, poles y zeros (objetos {re,im}); los desconocidos son null.
- bode: omega, magnitude, phase, asymMagnitude, asymPhase, breaks y margins. Todos los vectores comparten frecuencias en rad/s. Magnitud dB y fase grados; muestras no definidas son null.
- bode.margins: gm (dB),pm (grados),wgc,wpc (rad/s),gmState,pmState y all. gmState puede ser finite,infinite,undefined; pmState finite o undefined. all contiene {kind,omega,margin}: gain significa margen de ganancia asociado al cruce de fase; phase significa margen de fase asociado al cruce de ganancia. Puede agregarse error si el cálculo falla.
- locus: range,asymptotes,branches ({x,y}),openPoles,zeros,closedPoles,centroid,angles,breakaways ({re,im,k}),crossings ({omega,k}),segments ({min,max}); error opcional. Los segmentos infinitos se acotan a la ventana inicial para dibujar.
- temporal: time,input,output,metrics,impulseWeight; o error si no es simulable. Las métricas proceden de step_info y conservan sus nombres: RiseTime,SettlingTime,SettlingMin,SettlingMax,Overshoot,Undershoot,Peak,PeakTime,SteadyStateValue cuando están disponibles.
- stability: estado característico; selectedStability y baseStability: estado de la transferencia seleccionada y L₀. Valores stable,marginal,unstable; el característico puede ser undefined en un lazo singular.
- warnings: lista de avisos matemáticos.

La respuesta puede ser HTTP 200 y contener temporal.error o locus.error: es un análisis parcialmente disponible, no un fallo global de transporte.

## POST /api/algebra

[Solicitud](ejemplos/algebra.json) y [respuesta real](ejemplos/algebra-respuesta.json).

functions es una lista de 2 a 32 expresiones; parameters es un objeto opcional. operation admite series (predeterminado),parallel,subtract,feedback. Para varios operandos se acumula de izquierda a derecha. feedback significa result/(1+result·siguiente).

## POST /api/block-diagram/validate y solve

El grafo usa `schemaVersion:1`, hasta 128 nodos y 512 conexiones. Tipos admitidos: `input`, `output`, `transfer_function`, `gain`, `sum`, `junction`. Cada nodo tiene `id`, `type`, `inputs`/`outputs` (IDs de puerto); las transferencias y ganancias incluyen `expression`, los sumadores `signs` por puerto. Cada conexión tiene `id`, `sourceNodeId`, `sourcePortId`, `targetNodeId`, `targetPortId`. La validación estructural es independiente de posición y geometría. `solve` devuelve `transferMatrix` con cada par salida/entrada y `relations` con la ecuación completa. Los modelos numéricos aparecen cuando las expresiones solo dependen de `s`; parámetros simbólicos permanecen como expresiones. Mermaid se planifica como funcionalidad posterior y no es necesario para estos endpoints.

## POST /api/edit-roots

[Solicitud](ejemplos/edit-roots.json) y [respuesta real](ejemplos/edit-roots-respuesta.json).

expression:string requerido; kind:pole o zero (pole por defecto); index:entero≥0 requerido; re:número finito requerido; im:número finito predeterminado0; parameters:objeto opcional.

index se refiere al orden de roots del modelo actual: no reutilizarlo después de reconstruir el polinomio. Una raíz real se mantiene real; una compleja mueve su conjugada. La respuesta contiene la función reconstruida. No modifica una sesión del servidor ni el proyecto por sí sola.

## POST /api/validate-project

[Proyecto completo mínimo](ejemplos/validate-project.json). A diferencia de analyze, parameters es una **lista** de {name,value,min,max,step}. Requiere format=controllab,schemaVersion=1,view,asymptotic,history además del modelo. view: bode,lgr,plano,temporal,algebra. algebra opcional: {operation,functions}. charts opcional: claves bode-chart,lgr-chart,plano-chart,temporal-chart; cada una puede guardar xaxis,yaxis,xaxis2,yaxis2 con {range:[mínimo,máximo],autorange:boolean}. En ejes logarítmicos, Plotly almacena range en log10.

Valida todos los modelos g,h,l y operandos algebraicos, incluso los del modo inactivo, y ejecuta el análisis. No escribe archivos. Los nombres de parámetros deben ser únicos y los rangos coherentes.

## Errores

HTTP422 tiene {"detail":...}. Pydantic devuelve una lista con loc,msg,type y otros datos; un error del parser/núcleo adaptado por main.py devuelve detail como texto. Ejemplos: k negativo, modo desconocido, expresión incompleta, denominador cero, rango inválido o raíz inexistente. No asumir que detail es siempre string.

## Probar desde PowerShell

Desde la raíz del proyecto, con el servidor abierto:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/health
$body = Get-Content -Raw docs/ejemplos/analyze.json
$r = Invoke-RestMethod http://127.0.0.1:8765/api/analyze -Method Post -ContentType 'application/json' -Body $body
$r.models.t
$r.bode.margins
```

Cambiar analyze por algebra, edit-roots o validate-project tanto en archivo como en URL para ejecutar los demás ejemplos.
