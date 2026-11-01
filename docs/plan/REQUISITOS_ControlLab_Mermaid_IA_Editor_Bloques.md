# ControlLab — Requisitos para editor dual React Flow + Mermaid e intercambio con IAs

**Estado:** especificación para implementación · **Fecha:** 2026-10-31  
**Producto existente:** ControlLab (React + Python, `python-control`; LGR, Bode, plano complejo y respuestas).  
**Objetivo:** ampliar el editor de álgebra de bloques sin sustituir las funcionalidades actuales.

> **Instrucción de alcance:** implementar todo lo definido en este documento, por fases y con pruebas. Primero inspeccionar el repositorio real y reutilizar su infraestructura. No sustituir las bibliotecas ni refactorizar partes ajenas salvo necesidad documentada. El presente documento no es código ni presupone que la funcionalidad ya exista.

## 1. Objetivo y experiencia de usuario

ControlLab debe permitir representar un sistema de control continuo lineal e invariante en el tiempo (LTI) a través de dos interfaces que operan sobre el **mismo modelo semántico**:

1. **Editor gráfico React Flow:** arrastrar bloques, sumar señales, conectar puertos, bifurcar cables, crear y cerrar realimentaciones, mover componentes y consultar sus propiedades.
2. **Editor textual Mermaid Flowchart:** crear, pegar, editar y previsualizar el texto de un diagrama producido por una IA, importarlo de forma segura al editor visual y volver a exportarlo.

El usuario debe poder **diseñar primero** y presionar **Calcular equivalente** después; los cálculos no deben depender de la apariencia o de la posición visual de los elementos. El motor Python interpreta el grafo, obtiene relaciones entrada-salida y envía la transferencia compatible a LGR, Bode o respuesta temporal.

### Recorrido de usuario completo

1. Abrir ControlLab > Álgebra de bloques.
2. Elegir **Visual** o **Mermaid** (pestañas sincronizadas con el modelo aceptado).
3. Crear bloques y enlaces por el mouse **o** pegar un Flowchart de una IA.
4. Validar importación: sintaxis, semántica de puertos, signos y conectividad; resolver ambigüedades con un asistente.
5. Revisar el mismo diagrama en la vista visual, configurar funciones y puertos, crear más ramas.
6. Presionar **Calcular equivalente** y seleccionar la relación a obtener (por ejemplo, `Y/R | N=0`).
7. Ver expresión simbólica, forma factorizada/expandida, diagnóstico y, si procede, enviar al analizador.
8. Guardar proyecto local, exportar JSON, Mermaid y SVG/PNG.
9. Importar el JSON o Mermaid desde otra IA y continuar sin reescribir todo el diagrama.

## 2. Decisiones de arquitectura obligatorias

| Capa | Responsabilidad | Decisión |
|---|---|---|
| React | Interfaz general existente | **Reutilizar** |
| `@xyflow/react` | Editor visual, nodos, handles y edges | **Adoptar si no existe equivalente** |
| Mermaid.js | Editor textual, previsualización, validación sintáctica y exportación | **Complementario, no motor matemático** |
| Modelo semántico ControlLab | Fuente de verdad versionada de nodos, puertos, señales y conexiones | **Obligatorio** |
| Python + SymPy | Formar y resolver ecuaciones racionales simbólicas | **Responsable de equivalencia** |
| `python-control` | Evaluación numérica, estabilidad, LGR, Bode y respuestas admisibles | **Reutilizar integración existente** |
| MATLAB MCP | Verificación independiente y generación de referencias de prueba | **Solo desarrollo/QA; no requerido en ejecución normal** |

**No integrar PathView, Simulink, un segundo motor de simulación ni una API de IA de pago como condición de este módulo.** El intercambio con IA debe funcionar mediante copiar/pegar e importar/exportar archivos, sin conexión a servicios externos.

Separar estrictamente **geometría visual**, **semántica de señales** y **cálculo matemático**. Un nodo colocado a la izquierda, una flecha hacia arriba o el cruce de dos cables no bastan para deducir el signo ni la conexión matemática.

## 3. Modelo canónico versionado (JSON)

Definir y documentar un esquema propio, con validador y migraciones de versión. Debe incluir al menos:

- `schemaVersion`, `projectId`, `modelId`, nombre y metadatos no sensibles.
- Lista de **nodos** con ID estable, tipo, nombre, parámetros y posición visual.
- Lista de **puertos** con ID estable, rol (`input`/`output`), nombre, multiplicidad y signo de suma si aplica.
- Lista de **conexiones** con ID estable, `sourceNodeId`, `sourcePortId`, `targetNodeId`, `targetPortId`, señal y ruta visual opcional.
- Definición de **entradas independientes** (por ejemplo `R`, `N`, `A`, `B`) y **salidas observadas** (`Y`, `C`).
- Definición de ganancias y funciones racionales de cada bloque: literales (`1/s`, `s+1`) o parámetros simbólicos (`G1(s)`, `H2(s)`, `K`).
- Configuración de lazo y referencia al modelo de la función de transferencia que usa ControlLab.
- Estado opcional de vistas, zoom y disposición visual; no debe afectar los cálculos.

### Tipos de nodos obligatorios

| Tipo | Descripción | Semántica |
|---|---|---|
| `input` | Entrada independiente `R(s)`, `N(s)`, etc. | Señal fuente |
| `output` | Salida observable `Y(s)`, `C(s)` | Selección de resultado |
| `transfer_function` | Bloque con numerador/denominador o expresión simbólica | `salida = G(s) · entrada` |
| `gain` | Ganancia numérica o simbólica | Multiplicación |
| `sum` | Sumador con 2 o más puertos | Suma con signo explícito por **puerto de destino** |
| `junction` | Punto de toma/bifurcación | Una señal de entrada replicada sin modificar |

Los bloques con múltiples entradas solo están permitidos cuando su semántica se encuentre implementada (por ejemplo un sumador). Un bloque de función de transferencia simple tiene una entrada y una salida. **No representar una bifurcación duplicando el origen de la señal como si fueran dos variables diferentes.**

### Invariantes

- IDs de nodos, puertos y cables únicos y persistentes.
- Una entrada de puerto ordinario recibe una única señal; el sumador admite múltiples puertos de entrada distintos.
- Un puerto de salida puede alimentar muchas ramas; permitir crear `junction` explícitos para que sea visible.
- Los cruces visuales de cables no crean conexiones.
- El signo `+`/`−` vive en el puerto del sumador, no en la posición o dirección del cable.
- Los ciclos de realimentación son válidos; los bucles algebraicos singulares deben diagnosticarse.
- No perder parámetros cuando se mueve un nodo, se exporta o se cambia de editor.
- Calcular resultados desde el JSON validado; Mermaid no es la fuente de verdad.

## 4. Editor gráfico (React Flow): requisitos funcionales

| ID | Requisito | Obligación |
|---|---|---|
| VIS-01 | Paleta de entradas, salidas, transferencias, ganancias, sumadores y bifurcaciones | Sí |
| VIS-02 | Arrastrar elementos y reposicionarlos con el mouse | Sí |
| VIS-03 | Puertos de entrada/salida identificables y conexiones dirigidas | Sí |
| VIS-04 | Múltiples ramas desde un mismo punto de toma; añadir/eliminar ramas | Sí |
| VIS-05 | Crear una bifurcación insertando un punto de toma en un cable existente | Sí |
| VIS-06 | Editar cada función en el panel de propiedades sin perder forma simbólica | Sí |
| VIS-07 | Agregar/quitar puertos de sumador y establecer `+`/`−` por puerto | Sí |
| VIS-08 | Conectar realimentaciones, incluso anidadas y cruzadas | Sí |
| VIS-09 | Zoom, pan, seleccionar, multiselección, copiar, duplicar, borrar, deshacer/rehacer | Sí |
| VIS-10 | Cables ortogonales o editables; trazado legible y waypoints opcionales | Sí |
| VIS-11 | Reconectar un cable desde un puerto a otro; validar antes de confirmar | Sí |
| VIS-12 | Mostrar resaltados del recorrido, puertos sin conectar y errores | Sí |
| VIS-13 | Guardar/restaurar la disposición y propiedades del grafo | Sí |
| VIS-14 | Botón **Validar** separado de **Calcular equivalente** | Sí |
| VIS-15 | Habilitar edición visual luego de importar Mermaid y exportación posterior | Sí |
| VIS-16 | Evitar que un movimiento de nodos cambie resultados matemáticos | Sí |

Para múltiples `Handle` del mismo tipo, los IDs de los puertos deben ser distintos y estables. El cambio dinámico de puertos debe preservar o invalidar explícitamente las conexiones afectadas.

## 5. Editor Mermaid: requisitos específicos

### 5.1 Experiencia de edición

- Nueva pestaña **Mermaid**, junto a **Editor visual**.
- Editor de texto con resaltado, números de línea, mensajes de sintaxis, formato y botón **Aplicar al modelo**.
- Previsualización en vivo **solo si el texto es sintácticamente válido**; no modificar el modelo confirmado en cada pulsación.
- Dos funciones independientes: **Copiar Mermaid** y **Importar Mermaid**; compatibilidad con `.mmd`, `.md` (bloque Mermaid) y pegado de texto.
- Exportar JSON del modelo junto con Mermaid; compartir ambos cuando se necesite fidelidad máxima.
- En presencia de cambios concurrentes no guardados (Mermaid vs Visual), advertir y dar opciones: conservar borrador, aplicar, descartar, comparar o cancelar.
- Marcar claramente si el texto es **Mermaid genérico** o **Mermaid ControlLab enriquecido**.

### 5.2 Dos modalidades de importación

**A. Importación estricta, reversible (Mermaid ControlLab):**
- Definir un **subconjunto documentado** de `flowchart LR/TB` y una convención propia de metadatos con versión para: tipo de nodo, parámetros de transferencia, puertos destino, signos y nombres de señales.
- Exportar elementos y enlaces con identificadores estables.
- Mantener el contenido extra necesario para poder recuperar el mismo JSON semántico y las conexiones correctas.
- Definir gramática, ejemplos de referencia, parser y tests de round-trip. Los metadatos pueden utilizar comentarios propios claramente identificados, pero **no asumir** que editores de terceros los preservarán.
- No prometer preservación exacta de coordenadas del lienzo en Mermaid genérico: conservar posiciones mediante el JSON del proyecto o metadatos auxiliares propios.

**B. Importación asistida (Mermaid genérico de otras IAs):**
- Admitir el subconjunto de nodos y flechas documentados.
- Derivar solo hechos explícitos. Si `G1` es un nombre, no asumir automáticamente que representa una función racional completa sin parámetro definido.
- Si un sumador carece de signos, un cable carece de puerto destino o existen múltiples entradas ambiguas: **pedir mapeo de puertos y signos** en una vista previa y bloquear el cálculo hasta resolverlo.
- Mostrar lista de elementos no soportados y permitir cancelar sin modificar el proyecto.
- No hacer una importación aparentemente exitosa que cambie el significado de realimentaciones o bifurcaciones.

### 5.3 Exportación

- `ControlLab JSON`: formato maestro, con fidelidad semántica y geometría.
- `Mermaid ControlLab`: texto con metadatos propios para round-trip controlado.
- `Mermaid estándar`: representación portable para compartir; advertencia si pierde información no expresable.
- `SVG` y `PNG`: representación visual, no necesariamente editable.
- El Mermaid exportado debe pasar el parser oficial de Mermaid de la versión instalada.

### 5.4 Seguridad

- Renderizar Mermaid en modo de seguridad estricto/sandbox y no habilitar arbitrariamente scripts, HTML activo o enlaces peligrosos.
- No ejecutar texto Mermaid como JavaScript ni interpretar expresiones matemáticas con `eval`.
- Limitar tamaño de archivo/texto, número de nodos y complejidad del grafo; informar límites antes de un bloqueo.
- Analizar archivos y resultados de IAs como entradas no confiables y validar tanto en frontend como en backend.

## 6. Conversión y consistencia entre editores

**Modelo canónico JSON → React Flow**: nodos, puertos, conexiones y posiciones.  
**Modelo canónico JSON → Mermaid**: representación visual y metadatos que soporta el formato.  
**Mermaid válido → analizador de importación → JSON candidato → validación semántica → confirmación del usuario → JSON maestro.**

Requisitos:

1. Un cambio visual confirmado produce un nuevo modelo y permite regenerar Mermaid.
2. Un cambio Mermaid confirmado reconstruye la vista visual y preserva parámetros semánticos compatibles.
3. La edición de texto inconclusa no sobrescribe el modelo actual.
4. El resultado algebraico queda **desactualizado** tras cualquier cambio semántico; no tras un movimiento puramente visual.
5. Mantener un historial de revisiones con deshacer/rehacer consistente.
6. Round-trip estricto: JSON → Mermaid ControlLab → JSON, sin pérdida de nodos, puertos, signos, conexiones y funciones.
7. Round-trip estándar: documentar lo que puede perderse y exigir confirmación en ambigüedades; no atribuir equivalencia matemática no verificada.
8. Mantener identificadores estables de nodos y conexiones siempre que sea posible.

## 7. Motor algebraico Python: requisitos

Implementar o reutilizar un módulo de cálculo **independiente de React Flow y Mermaid** que reciba JSON semántico versionado:

1. Validar esquema, nodos, puertos, signos, referencias y caminos.
2. Convertir señales y bloques a relaciones lineales en el dominio de Laplace.
3. Construir un sistema de ecuaciones de señales y resolverlo simbólicamente con SymPy para todas las entradas independientes y salidas observables.
4. Manejar series, paralelos, sumadores, ganancias, bifurcaciones, retroalimentaciones simples, anidadas y múltiples.
5. Manejar grafos cíclicos sin asumir un orden topológico global; detectar singularidad de la matriz de ecuaciones y conexiones mal definidas.
6. Obtener una **matriz de transferencias** `T_ij(s)` entre cada entrada independiente y cada salida, con las demás entradas independientes anuladas para el cociente elegido.
7. Mostrar también la ecuación de salida completa, por ejemplo `Y(s)=T_YR(s)R(s)+T_YN(s)N(s)`.
8. Simplificar expresiones, conservar tanto la forma original como la forma reducida y registrar cancelaciones polo-cero potencialmente relevantes.
9. Diferenciar modelos simbólicos genéricos (`G1`, `G2`) de modelos numéricos concretos; no inventar datos para graficar.
10. Determinar si la transferencia es propia/realizable para los módulos de simulación. La equivalencia algebraica puede existir aunque una simulación temporal no esté soportada.
11. Si se envía una transferencia compatible al analizador, reutilizar el módulo `python-control` actual para LGR, Bode, polos, ceros, márgenes y respuesta temporal.
12. Conservar la distinción entre **G(s), H(s), GH(s), L(s)** y la transferencia cerrada `T(s)`; con solo `GH` no suponer que se conoce `G` para obtener `C/R`.
13. Calcular **solo cuando el usuario presione Calcular equivalente**; la validación estructural puede ser inmediata.
14. Rechazar expresiones inválidas, nodos desconectados relevantes, ciclos algebraicos singulares, bloques sin parámetros requeridos, y conexiones ambiguas mostrando el motivo.

La fórmula para los sistemas con múltiples fuentes **no** se sustituye por un único cociente sin antes fijar las demás entradas (por ejemplo `N=0`).

## 8. UI del resultado

Después de calcular, mostrar:

- Vista del diagrama original, con advertencias puntuales si existen.
- Lista de entradas independientes y salidas disponibles.
- Selector `Salida / Entrada | otras entradas = 0`.
- Ecuación general de salida con todas las entradas independientes.
- Función equivalente `T(s)`, expandida y factorizada.
- Vista de polos, ceros y estatus de simulabilidad para modelos numéricos.
- Mensajes de error semántico y enlaces al bloque afectado.
- Botones **Enviar a LGR**, **Enviar a Bode**, **Respuesta temporal**, **Copiar expresión**, **Exportar resultado** (solo si corresponde).
- Resultado y modelo deben conservar un `revisionId` común: si cambian signos o conexiones, invalidar resultado anterior.

**Nota sobre reducción:** en esta etapa es obligatorio obtener la expresión equivalente del grafo; generar automáticamente un diagrama visual reducido, mostrar todos los pasos de transformación o simular sistemas físicos arbitrarios queda explícitamente fuera hasta una fase posterior.

## 9. Casos funcionales imprescindibles

| ID | Escenario | Resultado requerido |
|---|---|---|
| ED-01 | Entrada → G1 → G2 → salida | `G1*G2` |
| ED-02 | Dos ramas en paralelo sumadas | `G1+G2` |
| ED-03 | Paralelo con sumador `+/-` | `G1-G2` |
| ED-04 | Realimentación negativa | `G/(1+G*H)` |
| ED-05 | Realimentación positiva | `G/(1-G*H)` |
| ED-06 | Traslado de sumador a través de bloque | Mismo resultado algebraico en diagramas equivalentes |
| ED-07 | Bloques en serie intercambiados en caso SISO | Misma transferencia `G1*G2` |
| ED-08 | Mismo cable con 3 y con 10 ramas | Una señal distribuida a todos los destinos |
| ED-09 | Cables que se cruzan sin punto de unión | No crean conexión lógica |
| ED-10 | Sumador con 4 o más entradas y signos mixtos | Expresión correcta |
| ED-11 | Dos realimentaciones anidadas | Cálculo por ecuaciones simultáneas |
| ED-12 | Dos entradas independientes `R(s)`, `N(s)` | Resultados `Y/R | N=0`, `Y/N | R=0` y ecuación completa |
| ED-13 | Bloques `1/s`, `s`, `s+1`, `1/(s+2)` | Equivalencia racional aunque no toda simulación sea admisible |
| ED-14 | Signos faltantes en Mermaid genérico | Importación asistida; no calcular hasta resolver |
| ED-15 | Mermaid ControlLab exportado e importado | Grafo semánticamente idéntico |
| ED-16 | Movimiento de nodos sin alterar aristas | Igual resultado y sin recálculo innecesario |
| ED-17 | Editar un signo o reemplazar conexión | Resultado invalidado y recalculado a solicitud |
| ED-18 | JSON exportado/importado | Modelo, funciones, puertos, signos y geometría conservados |

### Casos procedentes de los ejercicios aportados por el usuario

- **FOTO-01 (primera foto):** recrear `G1, G2, G3, G4, H1, H2`, sumadores y bifurcaciones, entradas `R(s)` y `N(s)`, salida `Y(s)`. Resolver `Y/R | N=0` y `Y/N | R=0`.
- **FOTO-02 (segunda foto):** recrear una cadena con bloques `1/s`, `s+1`, `s`, realimentaciones y sumadores, y obtener `C(s)/R(s)`.
- **TABLA-07:** reproducir las siete equivalencias de operaciones de álgebra de bloques de la tabla suministrada: reordenar sumadores, separarlos, intercambiar bloques SISO, serie, paralelo, traslado de sumador y distribución.

**Importante:** algunos signos o valores de las fotografías pueden no leerse con certeza. Registrar una transcripción verificada del grafo (puertos y signos) antes de fijar resultados numéricos de referencia. Nunca inventar la topología basándose solo en una similitud visual.

## 10. Verificación con MATLAB MCP

**No usar MATLAB como backend de ejecución cotidiana.** Crear un conjunto de pruebas de referencia con MATLAB MCP durante desarrollo:

1. Para cada fixture de grafo, guardar **JSON semántico**, resultados SymPy y salida de MATLAB.
2. En MATLAB, reconstruir la topología mediante operaciones equivalentes (`series`, `parallel`, `feedback`, `sumblk`, `connect` o interconexión apropiada). Evitar validar con exactamente la misma implementación/algoritmo Python.
3. Para bloques genéricos, fijar un conjunto documentado de funciones racionales de prueba, preferentemente propias y sin singularidades en los puntos de evaluación.
4. Comparar transferencias racionales simplificadas (equivalencia simbólica cuando sea posible) y muestras complejas `s=jω` en una malla de frecuencias comunes.
5. Para varios inputs/outputs, comparar cada elemento de la matriz de transferencias y la ecuación de combinación de entradas.
6. Para modelos numéricos propios, comparar polos, ceros, LGR, Bode y respuesta temporal en muestreos iguales si se utiliza el analizador existente.
7. Comparar con tolerancias explícitas y reglas especiales para cancelaciones y singularidades. No aceptar comparaciones basadas únicamente en capturas.
8. Registrar versión de las herramientas, modelo exacto, salida obtenida, error y estado.
9. Guardar fixtures de referencia en el repositorio para que CI pueda correr las pruebas de regresión **sin MATLAB**.
10. Si MATLAB MCP no está conectado, permitir ejecutar todas las funciones y pruebas locales; mostrar validaciones externas como 'No ejecutadas', no como 'Aprobadas'.

### Criterios iniciales de tolerancia

- Expresión racional simbólica: comprobar que la diferencia simplificada sea cero, si aplica.
- Respuesta frecuencial numérica: tolerancia relativa `1e-5` más tolerancia absoluta de `1e-8` en regiones bien condicionadas; casos singulares requieren reglas especiales.
- Comparación de polos y ceros: por emparejamiento no ordenado y tolerancia adecuada al condicionamiento, incluyendo multiplicidades.
- No usar equivalencia de coeficientes brutos como único criterio, pues una misma transferencia admite distintas factorizaciones y factores comunes.

## 11. Requisitos no funcionales

| ID | Requisito | Validación |
|---|---|---|
| NF-01 | Aplicación local, compatible con el frontend y backend actuales | Sin red externa en uso ordinario |
| NF-02 | Intercambio IA sin dependencia de proveedor | Copiar/pegar y archivos funcionan sin API de IA |
| NF-03 | Seguridad de Mermaid y expresiones | Sin ejecución arbitraria de scripts |
| NF-04 | Responsividad del lienzo | Prueba con al menos 30 nodos y 50 cables, incluyendo ciclos |
| NF-05 | Comportamiento con varias ramas | Casos de 3 y 10 bifurcaciones sin confundir señales |
| NF-06 | Reproducibilidad y persistencia | Cerrar/abrir conserva resultado semántico y geometría |
| NF-07 | Identificación de errores | Mensajes localizados que indiquen nodo, puerto o conexión |
| NF-08 | Versionado y compatibilidad | Migración de modelos y rechazo explícito de versiones desconocidas |
| NF-09 | Ausencia de regresiones | LGR/Bode existentes mantienen sus pruebas |
| NF-10 | Calidad visual | Gráficos legibles, estados de error, zoom y controles de teclado |
| NF-11 | Documentación | Ejemplos, guía de Mermaid soportado, convenciones de IA y límites |

Definir los umbrales de tiempos de cálculo mediante mediciones reales y presupuestos por categoría de diagrama, sin prometer que la simplificación simbólica general siempre será inmediata.

## 12. Plan de ejecución por fases y puertas de aceptación

### Fase A — Auditoría y diseño semántico
- Inspeccionar arquitectura React, Python, API, estructura de proyecto, versión real de bibliotecas y tests.
- Documentar JSON v1, semántica de puertos, sumadores y ramificaciones, y contrato API.
- **Aprobación:** fixtures ED-01 a ED-05 y FOTO-01/02 representables en JSON sin ambigüedad.

### Fase B — Editor gráfico
- Implementar nodos, puertos, bifurcaciones, interacciones, cableado y almacenamiento.
- **Aprobación:** recrear visualmente las dos fotografías, 3/10 ramas, sumadores con signos, guardar y reabrir.

### Fase C — Motor de equivalencia
- Implementar validador de grafo, traductor a ecuaciones, resolver simbólico y respuesta matricial multientrada.
- **Aprobación:** ED-01 a ED-13 y ejercicios suministrados con signos transcritos; validaciones con MATLAB.

### Fase D — Editor Mermaid e IA
- Añadir edición, render seguro, subconjunto documentado, importación estricta/enriquecida, importación genérica asistida y exportación.
- **Aprobación:** ED-14/15/18; round-trip de fixtures sin pérdida semántica en modalidad estricta.

### Fase E — Integración y calidad
- Conectar 'Enviar a LGR/Bode/Respuesta' con ControlLab, manejo de estados, documentación y regresión automatizada.
- **Aprobación:** ED-01 a ED-18; funciones existentes no se rompen; resultado MATLAB coincide dentro de tolerancias.

**Regla de implementación:** ejecutar cada fase, correr pruebas y mostrar resultados antes de pasar a la siguiente; no declarar el proyecto completo solo porque el diagrama se dibuja.

## 13. Entregables solicitados a Codex

1. Documento de arquitectura del editor dual y decisiones de reutilización del repositorio actual.
2. Modelo JSON v1 y esquema de validación con fixtures.
3. Editor React Flow integrado a ControlLab.
4. Editor Mermaid con importador/exportador y especificación del subconjunto ControlLab.
5. Motor Python de equivalencia simbólica y API existente o adaptador mínimo.
6. Conexión del equivalente al analizador numérico actual.
7. Pruebas unitarias, integración, UI, round-trip y casos de regresión.
8. Pruebas MATLAB MCP con reporte y referencias guardadas.
9. README con instrucciones locales y guía 'Cómo generar diagramas con IAs'.
10. Lista de restricciones conocidas y casos aún no soportados; ningún fallo silencioso.

## 14. Definición de terminado (DoD)

Se acepta la implementación cuando:

- El usuario crea por mouse sistemas con múltiples bifurcaciones y lazos anidados.
- Puede convertirlos a Mermaid, volver a importarlos y seguir editándolos.
- Puede pegar Mermaid de una IA y, si faltan datos, completar signos/puertos mediante un asistente.
- El JSON representa inequívocamente las señales y las conexiones.
- El botón **Calcular equivalente** obtiene resultados matemáticos para los casos soportados, con matriz de transferencia si hay varias entradas.
- Los casos de las fotografías y las siete equivalencias cuentan con fixtures y resultados verificados o transcripción pendiente indicada de forma expresa.
- MATLAB MCP valida independientemente una batería de pruebas y quedan referencias para regresión offline.
- No se rompen LGR, Bode, guardado de proyectos ni las funcionalidades originales.
- El producto informa honestamente límites de Mermaid genérico y simulabilidad de sistemas impropios.

## 15. Instrucción lista para entregar al agente implementador

> **Implementá íntegramente este documento en el repositorio ControlLab que tengo abierto, por fases y con pruebas. Primero auditá el frontend React, el backend Python y las dependencias existentes; no asumas que PathView ni Mermaid están ya instalados. La fuente de verdad será un JSON semántico versionado, React Flow será la interfaz visual y Mermaid un editor textual/importador/exportador con modo estricto y modo asistido. SymPy resolverá ecuaciones y `python-control` seguirá realizando análisis numérico. Construí soporte de múltiples bifurcaciones, múltiples entradas, sumadores con signos, lazos simples y anidados, y la función equivalente por cada entrada/salida. Probá los siete casos de equivalencias y las dos fotografías, sin inventar signos ilegibles. Usá MATLAB MCP como oráculo independiente para validación y almacená fixtures de regresión. Implementá y verificá fase a fase, registrando resultados, incompatibilidades y límites. No reemplaces el proyecto existente ni des por exitosas importaciones Mermaid ambiguas.**

## Referencias de documentación

- Mermaid Flowchart: https://mermaid.js.org/syntax/flowchart.html
- Mermaid API (`parse`, `render`, seguridad): https://mermaid.js.org/config/usage
- React Flow Handles: https://reactflow.dev/learn/customization/handles
- React Flow conexiones y validación: https://reactflow.dev/examples/interaction/validation
- React Flow guardar y restaurar: https://reactflow.dev/examples/interaction/save-and-restore
- SymPy control simbólico: https://docs.sympy.org/latest/modules/physics/control/control.html
