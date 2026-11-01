# Arquitectura y subsistemas

## Flujo de una modificación

1. App.tsx mantiene el proyecto: modo, expresiones, parámetros, K, vista y preferencias.
2. Agrupa cambios durante 150 ms y envía POST /api/analyze. Los parámetros se transforman de la lista editable a un objeto nombre→valor.
3. Pydantic valida la solicitud en backend/schemas.py. backend/core.py interpreta las expresiones y calcula los resultados.
4. Cada solicitud lleva revision. La interfaz cancela solicitudes anteriores y descarta resultados antiguos. Un error de entrada conserva el último resultado correcto.
5. Plotly dibuja las muestras recibidas. KaTeX representa las fórmulas con recursos locales; el redondeo visual no cambia los coeficientes de cálculo.

## Responsabilidades

| Subsistema | Código | Función |
|---|---|---|
| Entrada y estado | frontend/src/App.tsx, types.ts | Modelo compartido, parámetros, navegación, validación de proyectos y llamadas HTTP |
| Gráficos | frontend/src/Chart.tsx | Plotly, eventos hover/click/arrastre/zoom, exportación y rangos persistidos |
| Fórmulas | frontend/src/TransferFormula.tsx, math.ts | Polinomios a LaTeX, fracciones KaTeX y MathML |
| API | backend/main.py | Rutas HTTP, adaptación de errores y entrega del frontend compilado |
| Contratos | backend/schemas.py | Tipos Pydantic y límites de las solicitudes |
| Núcleo | backend/core.py | Parser, álgebra, raíces, Bode, márgenes, LGR, estabilidad y simulación |
| Ejecución | launch.py, iniciar.cmd, setup.cmd | Preparación, servidor loopback y apertura del navegador |
| Verificación | tests/, frontend/src/*.test.*, e2e/ | Comprobación matemática, estado/renderizado y flujos de navegador |

## Convención matemática

G₀ es la trayectoria directa base; H es la realimentación. L₀=G₀H. K es una ganancia de exploración independiente y no se escribe dentro de las expresiones.

- Trayectoria escalada: G_K=K G₀.
- Transferencia de lazo: L_K=K G₀H.
- Salida con realimentación negativa: T_K=K G₀/(1+K G₀H).
- Polos característicos: raíces de D₀+K N₀, conservando factores sin cancelar silenciosamente.

Las respuestas models.g y models.h son bases; models.l es L_K; models.l0 es L₀; models.t es T_K. Con GH directo no se conocen G/H originales ni una C/R única. El supuesto explícito H=1 construye un modelo equivalente.

## Cálculo y almacenamiento

El núcleo utiliza NumPy, SciPy y python-control. LGR mantiene una caché LRU de 32 modelos base; cambiar solamente K reutiliza sus ramas. Los valores no finitos de las curvas se transportan como null para interrumpir las líneas. Los estados de márgenes diferencian valores finitos, infinitos e indefinidos.

No existe una base de datos. Guardar descarga un JSON con modelos, parámetros, historial, álgebra, vista y rangos; abrir valida antes de sustituir el estado. Restaurar guardado usa la copia guardada/abierta en la sesión. Los archivos anteriores no se sobrescriben mediante un endpoint.

## Ejecución offline

FastAPI sirve frontend/dist/index.html y /assets. El servidor escucha 127.0.0.1:8765 por defecto. Node se necesita para desarrollo/compilación, no para ejecutar la versión compilada. KaTeX, sus fuentes y Plotly están empaquetados localmente. La documentación Swagger/ReDoc predeterminada puede requerir recursos externos: usar docs/openapi.json como contrato offline.
