# ControlLab — Plan de diseño, implementación y verificación del editor de álgebra de bloques

**Estado:** propuesta de diseño, sin implementación.  
**Versión del plan:** 1.0 — 31/10/2026.  
**Base existente:** frontend React; backend Python con `python-control`; MATLAB accesible mediante MCP en el entorno de desarrollo.  
**Referencias funcionales:** los dos ejercicios manuscritos proporcionados por el usuario; ejercicios básicos de serie, paralelo y realimentación.

## 1. Objetivo y criterio central

Incorporar a ControlLab un editor visual que permita **dibujar primero** un diagrama de bloques, **conectar después** sus señales con el mouse y **calcular a pedido** las funciones de transferencia equivalentes. Debe aceptar múltiples bifurcaciones, caminos de avance, sumadores y lazos de realimentación internos o externos. El resultado se enviará, cuando sea matemáticamente aplicable, a los módulos existentes de LGR, Bode y respuesta temporal.

**No es objetivo del MVP recrear Simulink ni simular cualquier modelo físico:** se trabajará con diagramas escalares de sistemas lineales e invariantes en el tiempo (LTI), continuos, en el dominio de Laplace y con condiciones iniciales nulas.

### Definición de terminado

Un usuario puede reproducir **ambos diagramas manuscritos**, incluyendo sus puntos de toma y retornos, seleccionar las entradas y salidas pertinentes, calcular los equivalentes y comprobarlos contra resultados independientes generados por MATLAB a través del MCP. La función calculada debe coincidir independientemente del orden en que se dibujaron los bloques.

## 2. Alcance del primer entregable

| Incluido | Pospuesto |
|---|---|
| Lienzo con arrastrar y soltar, puertos y conexiones | Diseño físico completo estilo Simulink |
| Bloques de transferencia, ganancia, entrada, salida, sumador y punto de toma | Bloques no lineales, sistemas discretos o MIMO |
| Varias ramas saliendo de una señal, conexiones que retornan y bucles anidados | Reducción **visual automática** paso a paso |
| Ecuaciones y función equivalente obtenidas desde el grafo | Simulación universal de sistemas impropios o con lazos algebraicos singulares |
| Múltiples entradas y una o más salidas, seleccionables | Controladores complejos y generación de código |
| Validación estructural, persistencia del dibujo y exportación visual | Colaboración multiusuario |
| Referencia matemática independiente con MATLAB MCP | Dependencia obligatoria de MATLAB para uso normal |

Las operaciones de **serie, paralelo, suma/resta y realimentación** deben surgir del grafo; no se obliga al usuario a indicar explícitamente la operación. Los diagramas equivalentes **no se redibujarán automáticamente** en el primer entregable; sí se mostrará su resultado matemático.

## 3. Experiencia de usuario / pantalla

**Diseño de tres zonas:**

1. **Barra izquierda (componentes):** Entrada R(s), Entrada N(s), Salida Y(s)/C(s), transferencia G(s)/H(s), ganancia K, sumador con puertos +/−, punto de toma, unión de señales.
2. **Lienzo central (editor React):** cuadrícula opcional, colocar/arrastrar nodos, conectar puertos con mouse, insertar bifurcación en una línea existente, redirigir, eliminar y duplicar líneas, desplazamiento, zoom, selección múltiple, deshacer/rehacer y ajuste a pantalla.
3. **Panel derecho e inferior (propiedades/resultados):** editar expresión de cada bloque, renombrar señales, configurar signos, elegir entrada y salida, ver advertencias, accionar **Validar diagrama** y **Calcular equivalente**, mostrar fórmula simbólica, forma expandida/factorizada y botones de envío a LGR/Bode/respuesta temporal.

**Interacción esperada:** dibujar → enlazar → cambiar expresiones/signos → validar → calcular → exportar/analizar. Modificar el dibujo invalida el último resultado y marca el modelo como «pendiente de recalcular»; nunca se presenta un equivalente obsoleto como actualizado.

### Reglas de conexión (fundamentales)

- Cada **puerto de entrada de bloque de transferencia** recibe una sola señal; la misma señal **puede alimentar múltiples destinos**.
- Conectar desde una salida ya utilizada está permitido: debe poder crearse una segunda, tercera o décima rama sin duplicar el bloque original.
- Un punto de toma explícito representa una bifurcación y conserva la identidad de la señal; alternativamente, el editor permite varias aristas desde el mismo puerto de salida y puede representarlas con un punto de toma visual.
- Debe poder **insertarse un punto de toma sobre una conexión**, después arrastrar un nuevo enlace desde ese punto a otro bloque.
- Los sumadores admiten 2 o más entradas y un signo **configurable por puerto**, no inferido por la posición del cable. Cada sumador tiene una salida.
- Se admiten caminos que vuelven desde la salida a sumadores anteriores: **no bloquear los ciclos por defecto**. El motor determinará si la realimentación produce un sistema matemáticamente definido.
- Cruzar dos líneas **no** significa conectarlas. Solo existe unión en un puerto, un punto de toma o un empalme explícito.
- Cada conexión debe conservar referencias estables a `nodo origen`, `puerto origen`, `nodo destino` y `puerto destino`. Las etiquetas visibles no sustituyen esos identificadores.
- Un cambio meramente visual (posición, ruta del cable, zoom) **no puede cambiar el resultado matemático**.

## 4. Componentes y propiedades mínimas

| Componente | Datos mínimos | Semántica |
|---|---|---|
| Entrada externa | ID, etiqueta, salida | Señal independiente: R(s), N(s), etc. |
| Salida observada | ID, etiqueta, entrada | Señal de la cual se desea una expresión o transferencia |
| Bloque de transferencia | ID, nombre, expresión racional en s, entrada y salida | Salida = G(s) × entrada |
| Bloque de ganancia | ID, símbolo o valor, entrada y salida | Caso particular de transferencia constante |
| Sumador | ID, lista ordenada de puertos con signo +/−, salida | Suma algebraica de señales entrantes |
| Punto de toma | ID, señal de entrada, salidas múltiples | Todas las salidas representan la misma señal |
| Conexión | ID, puertos, trayectoria visual | Igualdad de señal; el sentido de la flecha es significativo |

La interfaz debe permitir bloquear o distinguir nombres reservados: R, N, C/Y como señales externas y G1, G2, H1 como expresiones de transferencia. Si `G1(s)` no tiene una definición numérica, el resultado puede permanecer simbólico y no debe habilitar análisis numérico que requiera coeficientes.

## 5. Contrato del modelo gráfico con el cálculo

El **grafo** es la fuente de verdad; el frontend no debe decidir por sí solo que dos bloques están «en paralelo» solo porque estén dibujados a la misma altura. Cada nodo y arista se convierte en una relación entre señales.

**Pipeline funcional (sin código):**

1. Normalizar identificadores, conexiones y signos en un modelo de grafo versionado.
2. Validar puertos, conectividad y expresiones racionales; señalar errores en el lienzo por ID de nodo/conexión.
3. Generar las ecuaciones de cada bloque, sumador, toma y cable.
4. Resolver el conjunto completo de ecuaciones con **SymPy**, como sistema lineal sobre funciones racionales de `s`. Se obtiene la relación entre salidas e **inputs independientes**.
5. Simplificar y preservar, además, la representación sin cancelaciones, para informar sobre polos/ceros ocultos.
6. Convertir el resultado compatible a `python-control` para análisis dinámico y evaluación numérica.
7. Registrar advertencias si una inversión no existe, hay un lazo algebraico singular, aparece una expresión no propia o no hay suficiente información.

**Principio de cálculo:** una red de ecuaciones lineales puede representarse conceptualmente como `M(s)·x(s) = B(s)·u(s)` y `y(s) = C(s)·x(s) + D(s)·u(s)`. Resolverla produce una **matriz de transferencia** de las entradas hacia las salidas. El motor no debe depender de reducir manualmente una pareja de bloques cada vez.

### Varias entradas

Para una red con `R(s)` y `N(s)` que llega a `Y(s)`, mostrar:

- Relación general: `Y(s) = T_YR(s)·R(s) + T_YN(s)·N(s)`.
- Transferencia de referencia: `Y(s)/R(s)` con **N(s)=0**.
- Transferencia de perturbación: `Y(s)/N(s)` con **R(s)=0**.

Si existen varias salidas, permitir seleccionar el par salida/entrada y mostrar los demás resultados disponibles. Poner una entrada en cero para calcular una transferencia **no significa eliminar su bloque ni sus conexiones**.

### Bloques impropios y de derivación

La segunda fotografía incluye `s`, `s+1` y `s+2`, que son funciones de transferencia **impropias**. Deben admitirse en el motor simbólico para resolver el ejercicio, pero no se prometerá que todas puedan convertirse a espacio de estados ni simularse causalmente sin restricciones. El informe distinguirá **equivalencia algebraica**, **modelo numérico realizable** y **simulación temporal disponible**. La misma cautela se aplica a cancelaciones exactas y polos ocultos.

## 6. Integración recomendada (respetando React + Python existentes)

| Capa | Responsabilidad | Elección |
|---|---|---|
| React | Interfaz, interacción y estado visual | Proyecto actual + `@xyflow/react` |
| Estado del proyecto | Grafo, metadatos, posiciones y versiones | Formato JSON propio versionado |
| Backend Python | Validación semántica y resolución simbólica | SymPy |
| Análisis dinámico | Polos, ceros, Bode, LGR y respuesta temporal | `python-control` ya instalado |
| Interfaz HTTP | Recibir grafo y retornar expresiones, advertencias y análisis | Reutilizar la API que ya tenga ControlLab; no imponer framework nuevo |
| Referencia externa | Validación matemática independiente | MATLAB vía MCP desde el entorno de desarrollo |

Recomendación: **no incorporar un fork completo de PathView a esta fase**, porque el problema principal es reconocer correctamente el grafo y obtener transferencias equivalentes. Revisar su integración solo si se detecta una limitación concreta en React Flow.

## 7. Plan por fases y compuertas de salida

### Fase 0 — Auditoría del repositorio actual

- Relevar versión de React, librería de gráficas, API Python, tipos de modelo y contrato de ingreso G/H/GH.
- Identificar servicios y convenciones a reutilizar; no reemplazar los módulos de LGR/Bode.
- Confirmar la forma de invocar MATLAB MCP desde Codex/entorno y qué productos de MATLAB están habilitados.
- Entregable: diagrama de integración y listado de dependencias/licencias.
- **Aprobación:** identificado el punto de integración sin duplicar motores de cálculo.

### Fase 1 — Editor visual, sin resolución matemática

- Crear lienzo, biblioteca de nodos, puertos múltiples, sumadores con signos y conexiones dirigidas.
- Implementar ramificaciones sobre cables existentes, retornos, arrastre, zoom, selección, deshacer/rehacer y guardado/reapertura.
- Construir una reproducción visual de **ambas fotografías** sin realizar cálculos.
- **Aprobación:** todos los enlaces y bifurcaciones se conservan después de guardar y reabrir; cruces visuales no se convierten en uniones.

### Fase 2 — Validación estructural y modelo semántico

- Determinar conectividad real, dirección de señales, entradas/salidas independientes y signos de sumadores.
- Informar puerto sin conectar, conexión incompatible, salida huérfana y lazo algebraico singular.
- Distinguir retroalimentaciones válidas de errores estructurales sin prohibir ciclos.
- **Aprobación:** errores resaltados en el elemento exacto; dibujo válido convertido a un grafo matemático coherente.

### Fase 3 — Equivalencia simbólica (entregable central)

- Resolver serie, paralelo, suma/resta, caminos de avance, bifurcaciones y feedback simple, doble y anidado.
- Implementar composición de varias entradas, por ejemplo `R(s)` y `N(s)`, y selección de entrada/salida.
- Mostrar relación general y función equivalente en forma simplificada, expandida y factorizada.
- **Aprobación:** resultados correctos para los siete patrones básicos y para los dos ejercicios fotográficos, comparados con MATLAB.

### Fase 4 — Integración con ControlLab

- Enviar la función equivalente válida a LGR, Bode y respuesta temporal existentes.
- Aclarar cuando solo hay resultado simbólico, cuando está disponible la transferencia numérica y cuando no procede la simulación temporal.
- Marcar resultados como desactualizados cuando el usuario cambie un bloque o cable.
- **Aprobación:** modificaciones matemáticas disparan nuevo cálculo explícito y el análisis usa exactamente el resultado recién calculado.

### Fase 5 — Validación automática y regresión

- Construir fixtures versionados del grafo, resultados esperados independientes y métricas de comparación.
- Ejecutar verificación con MATLAB MCP sobre los casos de prueba y guardar el resultado de referencia.
- Complementar con pruebas de interacción en navegador, guardado y restauración.
- **Aprobación:** los casos obligatorios se aprueban y toda discrepancia queda trazada con información suficiente para reproducirla.

## 8. Matriz de pruebas de aceptación

| ID | Escenario | Acción verificable | Resultado exigido |
|---|---|---|---|
| UI-01 | Bloque simple | Arrastrar entrada, G, salida y enlazar | Diagrama válido |
| UI-02 | Tres ramas | Desde una misma señal conectar tres destinos | Identidad de señal y resultado correcto |
| UI-03 | Diez ramas | Repetir con diez destinos | No se pierde ni duplica ninguna señal |
| UI-04 | Bifurcación sobre línea | Insertar toma en cable existente | Mantiene la conexión original y crea nueva rama |
| UI-05 | Cruce sin empalme | Cruzar cables visualmente | No se conectan matemáticamente |
| UI-06 | Realimentación | Conectar salida a sumador anterior | Se admite la conexión; se valida el lazo |
| UI-07 | Sumador de tres entradas | Configurar signos `+`, `−`, `+` | Expresión correcta y signos persistidos |
| UI-08 | Edición y undo/redo | Mover, borrar y deshacer | Estado visual y semántico restaurado |
| UI-09 | Persistencia | Guardar, cerrar y reabrir | Mismos nodos, puertos y conexiones |
| UI-10 | Independencia de layout | Reubicar los bloques | Resultado equivalente invariable |
| MAT-01 | Dos bloques en serie | G1 y G2 | `G1·G2` |
| MAT-02 | Dos ramas en paralelo | G1 y G2 al sumador | `G1+G2` |
| MAT-03 | Sumador negativo | Entrada A positiva y B negativa | `A−B` |
| MAT-04 | Realimentación negativa | G en avance, H en retorno | `G/(1+G·H)` |
| MAT-05 | Realimentación positiva | Signo positivo en retorno | `G/(1−G·H)` cuando está definido |
| MAT-06 | Realimentaciones anidadas | Lazos interno y externo | Coincide con MATLAB |
| MAT-07 | Feedforward | Derivación superior hacia sumador final | Incluye contribución de ambas rutas |
| MAT-08 | Dos entradas | R y N alimentan salida Y | Dos transferencias separadas y relación general |
| MAT-09 | Bloque impropio | s, s+1 y s+2 | Equivalencia simbólica, simulación condicionada |
| MAT-10 | Orden de edición | Conectar en secuencias diferentes | Mismo resultado |
| MAT-11 | Denominador nulo / singularidad | Modelo inválido | Error claro, sin resultado falsamente válido |
| INT-01 | Enviar equivalente | Transferencia válida a Bode/LGR | Igual función y parámetros |
| INT-02 | Resultado obsoleto | Cambiar un puerto después de calcular | Resultado previo no se presenta como vigente |
| VAL-01 | Ejercicio manuscrito 1 | Reproducir G1-G4, H1-H2, R, N, Y | `Y/R` con N=0, y `Y/N` con R=0 |
| VAL-02 | Ejercicio manuscrito 2 | Reproducir bloques 1/s, s+1, s, s+2 y retornos | `C/R` coincide con MATLAB |

**Importante para VAL-01 y VAL-02:** las fotografías son la referencia visual. Antes de fijar el resultado esperado, un responsable debe aprobar la transcripción de **cada signo y cada unión** (especialmente en el segundo sumador de la fotografía de pizarra). Los resultados analíticos de referencia no se inventarán a partir de una lectura ambigua.

## 9. Protocolo de comparación con MATLAB MCP

El entorno de desarrollo será el responsable de invocar MATLAB mediante su MCP; **MATLAB no será parte obligatoria del runtime de la aplicación**.

1. Fijar un caso de prueba con ID, grafo JSON, valores/expresiones de los bloques, puertos, signos, entradas y salidas.
2. Construir en MATLAB un modelo matemático independiente: `tf`/`series`/`parallel`/`feedback` para casos básicos y `sumblk` + `connect` para diagramas interconectados. Si los bloques impropios hacen inviable algún método de interconexión, validar su identidad algebraica por operaciones racionales, sin declarar que la simulación pasó.
3. Obtener de MATLAB transferencias resultantes, polos y ceros aplicables, respuesta frecuencial en una malla fija y, cuando corresponda, respuesta temporal.
4. Ejecutar ControlLab sobre **el mismo grafo**, con idénticas convenciones y parámetros.
5. Comparar expresiones normalizadas simbólicamente; contrastar también valores en puntos del plano complejo alejados de polos, para detectar discrepancias de signos y cables.
6. Guardar un reporte por prueba: versión de ambos motores, fecha, parámetros, matriz de transferencia, errores, tolerancias, advertencias y enlace al diagrama/fixture.
7. Congelar los resultados aprobados como referencias de regresión, de modo que la suite básica se ejecute sin abrir MATLAB cada vez.

**MATLAB MCP debe actuar como oráculo de comprobación, no como motor permanente del editor.** Para pruebas con resultados dudosos, verificar también manualmente la ecuación de señales o utilizar una segunda representación independiente.

### Tolerancias iniciales sugeridas

- **Equivalencia simbólica:** diferencia racional simplificada igual a cero, siempre que las expresiones estén definidas; contemplar cancelaciones y dominios.
- **Respuesta en frecuencia en puntos de prueba bien condicionados:** error relativo objetivo ≤ 1e−6 (con tolerancia absoluta cercana a cero).
- **Polos y ceros simples:** error absoluto objetivo ≤ 1e−6; comparar como conjuntos, no por el orden de salida.
- **Bode exportado del equivalente:** magnitud ≤ 0,1 dB y fase ≤ 0,5° al comparar con la misma convención de fase.
- **Casos especiales:** lazos singulares, polos repetidos y cancelaciones requieren criterios específicos; un `Inf`/`NaN` sin explicación no aprueba.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Confundir dibujo con conectividad real | Cada cable usa IDs de puerto; cruces no crean uniones implícitas |
| Bifurcaciones con errores de identidad | Fuente única, puntos de toma explícitos y pruebas de 3/10 ramas |
| Resolver solo cascadas simples | Motor basado en ecuaciones globales y no heurísticas de ubicación |
| Ciclos de retroalimentación complejos | Validar invertibilidad del sistema de ecuaciones y rechazar singularidades |
| Bloques impropios de la segunda foto | Resolver simbólicamente primero; distinguir equivalencia de simulación |
| Símbolos G1/H2 sin coeficientes | Mantener expresión simbólica y deshabilitar análisis numérico hasta completar definiciones |
| Diferencias entre SymPy, python-control y MATLAB | Fijar convenciones, magnitudes, versiones y reportar tolerancias |
| Modificar ControlLab actual durante la integración | Nuevo módulo aislado; API estable; regresión de LGR/Bode existente |

## 11. Decisiones concretas para implementar sin ampliar alcance

1. **Editor:** React Flow en el frontend React ya existente; no iniciar un nuevo proyecto paralelo.
2. **Modelo:** grafo con nodos, puertos, aristas, sumadores y símbolos nombrados; formato versionado.
3. **Bifurcaciones:** un origen puede tener N destinos; botón para insertar punto de toma en un cable.
4. **Resultado:** botón **Calcular equivalente**, no cálculo automático mientras se dibuja; validación estructural inmediata.
5. **Motor:** SymPy resuelve ecuaciones racionales de la red; python-control consume modelos compatibles para análisis.
6. **Varias entradas:** obtener matriz de transferencias e indicar explícitamente condiciones `N=0` o `R=0`.
7. **Validación:** MATLAB MCP y fixtures de referencia para los dos diagramas y las operaciones fundamentales.
8. **Fuera de esta iteración:** redibujado automático de pasos de reducción y simulador universal tipo Simulink.

## 12. Referencias técnicas

- React Flow (nodos, puertos múltiples, validación): https://reactflow.dev/learn/customization/handles y https://reactflow.dev/examples/interaction/validation
- Python Control: https://python-control.readthedocs.io/en/stable/generated/control.interconnect.html
- Python Control — sumadores: https://python-control.readthedocs.io/en/latest/generated/control.summing_junction.html
- MATLAB — interconexiones: https://www.mathworks.com/help/control/ug/connecting-models.html
- MATLAB — sumblk: https://www.mathworks.com/help/control/ref/sumblk.html

---

**Estado de ejecución:** este documento contiene exclusivamente el plan. No se ha implementado, probado ni modificado el código de ControlLab en el marco de este entregable.
