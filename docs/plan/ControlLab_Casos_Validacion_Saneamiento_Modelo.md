# ControlLab — Plan de pruebas y saneamiento del modelo de álgebra de bloques

**Versión:** 1.0  
**Estado:** Especificación de pruebas, no ejecución del repositorio  
**Alcance:** editor React Flow, intercambio Mermaid/JSON, análisis Python (SymPy + python-control) y referencia independiente MATLAB MCP.

## 1. Propósito

Detectar errores antes de aceptar, resolver, guardar o analizar un diagrama de control. La fuente de verdad será un **grafo semántico versionado**, no la posición de los dibujos o el SVG/Mermaid renderizado.

Las pruebas se dividen en: (a) validación de sintaxis y estructura, (b) consistencia semántica de señales, (c) equivalencia algebraica, (d) interacción y persistencia, (e) interoperabilidad Mermaid/IA, y (f) contraste independiente con MATLAB.

## 2. Contrato mínimo del modelo

Cada proyecto debe representar:

- `schemaVersion`, ID del modelo y fecha/versión de modificación.
- Nodos tipados: `input`, `output`, `transfer`, `gain`, `sum`, `junction`.
- ID único y estable por nodo, además de los puertos identificados por ID.
- Parámetros de bloque: representación algebraica y expresiones racionales normalizadas.
- En los sumadores: puertos de entrada independientes, cada uno con signo explícito `+1` o `-1`.
- Aristas: referencia a ID de nodo y de puerto en origen y destino. Una salida puede alimentar múltiples destinos; cada puerto de entrada de bloque ordinario tiene un único conductor. Los sumadores poseen puertos separados.
- Entradas independientes y salida(s) observadas; definición de la relación solicitada, por ejemplo `C/R` con las demás entradas fijadas en cero.
- Coordenadas y estilo visual separados de la semántica matemática.
- Semántica explícita de paso directo y de los ciclos, en lugar de inferir signos por la posición geométrica.

**Estados de saneamiento:** `VALID`, `WARN`, `INVALID`, `UNSUPPORTED`, `NEEDS_REVIEW`. El cálculo definitivo se bloquea para `INVALID`, `UNSUPPORTED` y `NEEDS_REVIEW`. `WARN` permite cálculo si la advertencia no compromete la interpretación.

## 3. Pruebas estructurales del grafo (SV)

| ID | Entrada o manipulación | Resultado esperado | Severidad |
|---|---|---|---|
| SV-01 | Proyecto JSON válido, 1 entrada → 1 bloque → 1 salida | `VALID`; topología conservada | P0 |
| SV-02 | IDs de nodos duplicados | `INVALID`; informar los IDs | P0 |
| SV-03 | Arista cuyo nodo destino no existe | `INVALID` (referencia colgante) | P0 |
| SV-04 | Arista conectada a puerto inexistente | `INVALID`; identificar puerto | P0 |
| SV-05 | Dos aristas a un único puerto ordinario | `INVALID`; exigir sumador o puertos distintos | P0 |
| SV-06 | Sumador con una entrada sin signo | `NEEDS_REVIEW`; no asumir + o − | P0 |
| SV-07 | Bloque sin función, denominador cero o expresión mal formada | `INVALID` | P0 |
| SV-08 | Cruce geométrico de dos cables sin nodo de unión | No genera conexión eléctrica/matemática | P0 |
| SV-09 | Salida única alimentando 3 ramas explícitas | Las 3 reciben exactamente la misma señal | P0 |
| SV-10 | Salida única alimentando 10 ramas explícitas | Las 10 reciben exactamente la misma señal | P1 |
| SV-11 | Entrada sin camino hacia salida observada | `WARN`; la transferencia desde esa entrada es 0 | P1 |
| SV-12 | Bloque desconectado que no afecta a la salida | `WARN`; no altera el resultado | P1 |
| SV-13 | Ciclo de realimentación con inversa algebraica inexistente (p.ej. y = y + r) | `INVALID`; sistema no bien determinado para r genérico | P0 |
| SV-14 | Valor NaN, infinito o coordenada ilegal en JSON | Rechazar o sanear geometría sin cambiar semántica | P1 |
| SV-15 | Expresión maliciosa o llamada Python en campo matemático | No ejecutarla; `INVALID` | P0 |
| SV-16 | Modelo no propio, p.ej. G(s)=s+1 | Resolver simbólicamente si corresponde; advertir antes de simular | P0 |

## 4. Casos algebraicos unitarios (ALG)

Definir siempre el sentido de la realimentación y qué señales se fijan en cero. Comparar expresiones racionales por **simplificación algebraica de la diferencia** y pruebas numéricas fuera de polos, no solo por textos o coeficientes originales.

| ID | Diagrama | Resultado esperado | Prioridad |
|---|---|---|---|
| ALG-01 | R → bloque unidad → C | C/R=1 | P0 |
| ALG-02 | R → G1=1/(s+1) → G2=1/(s+2) → C | C/R=1/((s+1)(s+2)) | P0 |
| ALG-03 | R bifurca a G1 y G2; sumador positivo de ambas ramas → C | C/R=(2s+3)/((s+1)(s+2)) | P0 |
| ALG-04 | G=1/(s+1), H=1/(s+2), retroalimentación negativa | C/R=(s+2)/((s+1)(s+2)+1) | P0 |
| ALG-05 | Misma G,H, retroalimentación positiva | C/R=(s+2)/((s+1)(s+2)-1) | P0 |
| ALG-06 | Tres sumandos: +A, −B, +C | Y=A−B+C | P0 |
| ALG-07 | Sumador (+A,−B) → bloque G | Y=G(A−B); Y/A (B=0)=G, Y/B (A=0)=−G | P0 |
| ALG-08 | G=2/(s+1), H=3/(s+2) negativa | L=GH=6/((s+1)(s+2)), T=C/R=2(s+2)/(s²+3s+8) | P0 |
| ALG-09 | Una entrada A se divide en 3 ganancias 1,2,3 que se suman | Y/A=6 | P0 |
| ALG-10 | Una entrada A se divide en 10 ganancias unitarias que se suman | Y/A=10 | P1 |
| ALG-11 | Lazo interno: G1=1/(s+1), H1=1 negativo; después G2=1/(s+3), H2=2 negativo externo | C/R=1/((s+2)(s+3)+2) = 1/(s²+5s+8) | P0 |
| ALG-12 | G(s)=(s+1)/((s+1)(s+2)) | Expresión entrada-salida mínima 1/(s+2); conservar advertencia de cancelación en modelo original | P1 |
| ALG-13 | Bloque G=0 en una ruta | La contribución de esa ruta es 0; no dividir por G al reducir | P0 |
| ALG-14 | Lazo instantáneo positivo con G=1, H=1 (y=r+y) | Singular; no producir C/R | P0 |
| ALG-15 | Dos entradas R,N al sumador: R+N → G=1/(s+1) → Y | Y/R (N=0)=G, Y/N (R=0)=G | P0 |
| ALG-16 | Modificar únicamente posiciones de nodos en ALG-02 | La transferencia permanece idéntica | P0 |

### Caso integral ALG-17 — Ejercicio complejo del archivo de referencia

**Importante:** el resultado depende de **estos signos concretos** del material adjunto, que deben registrarse explícitamente en el fixture, no deducirse automáticamente de una imagen:

- Suma 1: E1=R−X/s.
- Suma 2: E2=−E1+U/(s+1).
- Bloque 1/s: X=E2/s.
- Suma 3: E3=X−(s+2)C.
- Bloques finales: U=(s+1)E3 y C=sU.

La forma equivalente derivada por resolución simultánea es:

\[
\frac{C(s)}{R(s)}=\frac{s^3+s^2}{-s^5-3s^4-s^3+2s^2+3s+1}.
\]

**Muestras independientes:**

| s | Valor de C(s)/R(s) |
|---|---|
| 0 | 0 |
| 1/2 | 12/85 ≈ 0.141176470588 |
| 1 | 2 |
| 2 | −12/73 ≈ −0.164383561644 |
| −1 | 0 |
| j | 1/25 + (7/25)j |

**Polos aproximados**: −2.43022424, −0.47835986, 1.06651940, −0.57896765 ± 0.68654523j. Por lo tanto el modelo entrada-salida es **inestable**. No usar simulación temporal de un bloque impropio intermedio como requisito para aprobar equivalencia simbólica.

**Criterios ALG-17:**
1. Importar el fixture de grafo con 3 sumadores y 6 bloques y bifurcaciones, sin alterar los signos.
2. La salida de Python coincide con la expresión indicada de forma simbólica.
3. Las ecuaciones originales se satisfacen para los puntos de evaluación definidos.
4. El resultado numérico de MATLAB (vía ecuaciones de señal independientes) coincide dentro de tolerancia.
5. Si se cambia un signo, la prueba de regresión detecta una transferencia distinta.
6. El grafo Mermaid exportado e importado vuelve a dar la misma relación entrada-salida.

## 5. Casos visuales e interactivos (UI)

| ID | Acción | Resultado esperado |
|---|---|---|
| UI-01 | Crear bloque arrastrando biblioteca al lienzo | Nodo válido con IDs y puertos únicos |
| UI-02 | Arrastrar desde puerto de salida hacia puerto de entrada | Nueva arista dirigida correcta |
| UI-03 | Ramificar una señal hacia 3 y 10 destinos | Todos conectados a la misma señal; sin duplicar señal numéricamente |
| UI-04 | Insertar punto de toma sobre una conexión | La arista se reemplaza por conexiones semánticamente equivalentes |
| UI-05 | Dibujar líneas cruzadas sin punto de unión | No se conectan |
| UI-06 | Reasignar signo de un sumador | Cambia la expresión y se invalida resultado previo |
| UI-07 | Cambiar función de G(s) | Se recalcula al solicitarlo; no mostrar cálculo viejo como vigente |
| UI-08 | Mover, alinear, zoom, deshacer y rehacer | No se alteran señales ni transferencias |
| UI-09 | Guardar y reabrir proyecto | Igual grafo semántico; mismas transferencias |
| UI-10 | Calcular con grafo incompleto | Presentar errores y resaltar los puertos afectados |
| UI-11 | Diagrama con 2 entradas y 1 salida | Seleccionar transferencia entrada→salida y fijar las otras entradas en 0 |

## 6. Intercambio Mermaid / IA (IM)

| ID | Entrada o acción | Resultado esperado |
|---|---|---|
| IM-01 | JSON canónico → Mermaid enriquecido → JSON canónico | Equivalencia estructural/semántica, independientemente de orden y coordenadas |
| IM-02 | Diagrama con sumadores +,− y tres bifurcaciones | Preservar IDs de puertos y signos en metadatos no ambiguos |
| IM-03 | Mermaid genérico con etiqueta `−` sobre una línea, sin puerto definido | `NEEDS_REVIEW`; no asumir signo automáticamente |
| IM-04 | Mermaid genérico con ramificación en varios destinos | Inferir conectividad solo si está inequívocamente expresada |
| IM-05 | Diagrama Mermaid con un cruce visual de aristas | No crear unión por proximidad geométrica |
| IM-06 | Mermaid sintácticamente inválido | Mostrar línea/causa y conservar el último modelo válido |
| IM-07 | Mermaid con sintaxis no soportada | Informar incompatibilidad o modo de revisión; no descartar silenciosamente elementos |
| IM-08 | Importación de IA con IDs repetidos o puertos inexistentes | Bloquear y diagnosticar |
| IM-09 | Exportar y reimportar ALG-17 | Misma expresión C/R y mismas ecuaciones de señales |
| IM-10 | Dos IAs producen el mismo JSON semántico con distinto orden | Misma transferencia equivalente |
| IM-11 | JSON con versión anterior soportada | Migración documentada o error explícito sin pérdida silenciosa |
| IM-12 | Texto de Mermaid con HTML/scripts/campos peligrosos | Visualización segura; no ejecución de código |

**Nota:** Mermaid estándar no es formato semántico completo de Sistemas de Control. La reversibilidad estricta corresponde solamente a Mermaid enriquecido generado por ControlLab y acompañado de los metadatos suficientes; en Mermaid genérico, asumir modo de revisión asistida.

## 7. Pruebas metamórficas: resultados que no deben cambiar (MT)

- **MT-01**: Intercambiar dos bloques SISO escalares en serie: G1G2 y G2G1 producen la misma transferencia.
- **MT-02**: Reemplazar una conexión por dos conexiones y una unión explícita de paso unitario: no cambia el resultado.
- **MT-03**: Reordenar entradas de un sumador preservando sus signos y fuentes: no cambia el resultado.
- **MT-04**: Duplicar caminos equivalentes en paralelo: el valor de la transferencia cambia de G a 2G; no confundir duplicación de línea con duplicación de camino.
- **MT-05**: Renombrar etiquetas visuales manteniendo identidad de puertos y señales: no cambia el resultado.
- **MT-06**: Modificar un signo de retroalimentación de − a +: en un caso de prueba no degenerado DEBE cambiar el resultado.
- **MT-07**: Comparar diagrama original de ALG-17 con diagrama de un único bloque de transferencia equivalente: transferencias idénticas.
- **MT-08**: Importar/exportar/importar modelo canónico repetidamente: nunca cambiar conectividad, signos o transferencia.

## 8. Contraste con MATLAB MCP (MAT)

**No se afirma haber ejecutado MATLAB MCP en este documento.** El agente implementador ejecutará las pruebas en su entorno y guardará los resultados obtenidos.

- Para bloques propios/realizables: contrastar con operaciones e interconexiones del Control System Toolbox (`feedback`, `series`, `parallel`, `connect`/`sumblk` según corresponda).
- Para diagramas con bloques impropios como `s`, `s+1` o `s+2`: contrastar **algebraicamente** mediante ecuaciones de señales y funciones racionales simbólicas en MATLAB si dispone de Symbolic Math Toolbox; como segunda opción, evaluar las ecuaciones numéricamente en varios valores complejos de `s` donde sean definidas. No exigir simulación de tiempo de una realización impropia.
- La referencia de MATLAB debe construirse **desde las ecuaciones de los nodos**, no copiando el resultado simplificado obtenido por Python; de lo contrario no es una verificación independiente.
- Comparar función racional simplificada, polos y ceros, y evaluación compleja en puntos definidos. Los modos numéricos se deben comparar considerando tolerancias y emparejando conjuntos de raíces, no por posición en arreglos.

| ID | Caso | Verificación |
|---|---|---|
| MAT-01 | ALG-02 y ALG-03 | Ecuaciones y evaluaciones de serie/paralelo |
| MAT-02 | ALG-04 y ALG-05 | Diferencia de signo en realimentación |
| MAT-03 | ALG-08 | Comparar `G`, `H`, `GH` y `T` correctamente |
| MAT-04 | ALG-11 | Realimentación anidada y orden de cierre |
| MAT-05 | ALG-15 | Múltiples entradas; cada transferencia parcial con otras entradas en 0 |
| MAT-06 | ALG-17 | Ecuaciones independientes, evaluaciones y polos |
| MAT-07 | ALG-14 | Reconocer singularidad; evitar falso resultado |
| MAT-08 | ALG-12 | Detectar cancelación y distinguir sistema original del mínimo |

### Tolerancias iniciales

- Para equivalencia racional exacta: `simplify(T_controlLab - T_ref) == 0` cuando ambos son simbólicos y la operación está definida.
- Evaluación numérica: `|a-b| <= 1e-8 + 1e-6 * max(|a|,|b|)` **lejos de polos** y con casos de orden bajo bien condicionados.
- Polos simples: distancia de correspondencia ≤ `1e-5` si el modelo está bien condicionado; tolerancia especial para raíces múltiples o cercanas.
- Funciones no propias pueden tener equivalencia algebraica pero no aptitud para las mismas simulaciones temporales.
- Si un caso no puede ejecutarse por licencia o indisponibilidad de MATLAB: registrar `NOT_RUN`, no `PASS`.

## 9. Saneamiento y errores de seguridad

- Parsear expresiones racionales con una gramática restringida o parser seguro; **nunca** con `eval`, `exec` ni ejecución arbitraria de SymPy desde cadenas sin validación.
- En React, escapar etiquetas no confiables y sanitizar representación HTML/SVG; impedir código ejecutable en proyectos importados.
- Aplicar límites configurables de tamaño (cantidad de nodos, aristas, longitud de expresión, profundidad de análisis y tiempo máximo de simplificación), sin afirmar límites arbitrarios como requisitos físicos.
- Imponer tamaño máximo de carga, protección contra recursión excesiva y cancelación de trabajos de simbología costosos.
- No exponer puertos públicos de servicios locales por defecto.
- Conservar último modelo válido si falla una importación y evitar sobrescritura automática de proyectos.

## 10. Orden de ejecución y puertas de calidad

1. **P0-Estructura:** SV-01 a SV-09, SV-13, SV-15 y SV-16; ninguna conexión incorrecta debe aceptarse.
2. **P0-Álgebra:** ALG-01 a ALG-09, ALG-11, ALG-13 a ALG-17; resultados numéricos/simbólicos correctos.
3. **P0-Editor:** UI-01 a UI-07, UI-10 y UI-11; bifurcaciones y signos correctos.
4. **P0-Intercambio:** IM-01, IM-02, IM-03, IM-06, IM-08, IM-09 e IM-12; ninguna pérdida silenciosa.
5. **Referencia MATLAB:** MAT-01 a MAT-08; diferencias dentro de tolerancia o `NOT_RUN` documentado si falta el servicio.
6. **Regresión ampliada:** todos los P1, guardado, UX, pruebas metamórficas y modelos aleatorios bien formados.

**Criterio de liberación:** ningún P0 fallido, ningún resultado matemático presentado como válido si su grafo es ambiguo, y reporte con evidencias de contraste MATLAB para casos compatibles.

## 11. Formato mínimo del reporte por caso

- `test_id`, versión/commit de ControlLab, versión del esquema, fecha.
- Archivo fixture del grafo semántico y diagrama Mermaid si corresponde.
- Salida solicitada y entradas fijadas a cero.
- Estado del saneamiento: `VALID` / `WARN` / `INVALID` / `UNSUPPORTED` / `NEEDS_REVIEW`.
- Expresión de ControlLab (sin simplificar y simplificada) y resultado de referencia independiente.
- Valores de evaluación, error absoluto/relativo, tolerancia, `PASS` / `FAIL` / `NOT_RUN`.
- Identificación de nodo/arista que origina el fallo, cuando corresponda.
- Evidencia MATLAB MCP (captura de ejecución, datos o log de resultado, no solo una captura del gráfico).

## 12. Prompt de ejecución sugerido para Codex

> Audita la arquitectura actual de ControlLab. Implementá una suite de validación y saneamiento del modelo semántico de álgebra de bloques siguiendo `ControlLab_Casos_Validacion_Saneamiento_Modelo.md`. Primero definí fixtures del grafo y validadores de esquema/semántica; después pruebas del motor SymPy/python-control, pruebas UI en React Flow y tests de importación/exportación Mermaid. No modifiques la función esperada para que coincida artificialmente con la implementación. Ejecutá MATLAB MCP cuando esté disponible para construir referencias independientes desde ecuaciones de señales. Guardá evidencias y un reporte PASS/FAIL/NOT_RUN por caso, priorizando P0. No declares éxito por apariencia de los gráficos ni por un único punto numérico. Registrá ambigüedades de signos como NEEDS_REVIEW.

---

**Alcance del documento:** casos y valores esperados de diseño; no implica que el repositorio del usuario haya sido ejecutado ni que se hayan corrido pruebas con MATLAB MCP.
