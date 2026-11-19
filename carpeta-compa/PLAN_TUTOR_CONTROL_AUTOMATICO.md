# Plan de implementación por fases · Tutor interactivo de Control Automático

**Destinatario:** un único agente ejecutor con acceso a este repositorio.

**Fuente docente:** [FINAL TEORÍA DE CONTROL - LF.pdf](<./FINAL TEORÍA DE CONTROL - LF.pdf>), 65 páginas. Las referencias de este plan usan la página del visor, contando la portada como página 1.

**Estado de ejecución:** 33 actividades implementadas y verificación de software completada el 19 de noviembre de 2026. La comprobación en un teléfono físico queda pendiente.

## 1. Encargo y alcance

Construir un tutor que enseñe a resolver los ejercicios de la carpeta **un paso por vez**, siguiendo el método del apunte. El estudiante aprende calculando, eligiendo factores, marcando puntos y explicando cambios en el gráfico. La prioridad es **90 % práctica y 10 % teoría**. Toda actividad debe poder completarse desde el celular sin lápiz.

La decisión de arquitectura propuesta es añadir una vista **Tutor** en ControlLab, con navegación y estado de práctica propios. Reutilizar los cálculos y los componentes gráficos que sirvan. El tutor empieza con la consigna y, cuando corresponde, con ejes vacíos. Cada respuesta habilita una construcción concreta. En Bode, el estudiante debe poder **dibujar y sumar por partes** aunque el laboratorio ya sepa calcular el diagrama final.

- **Recorrido:** Bode directo, LGR, Routh-Hurwitz, álgebra de bloques, Laplace y error estacionario.
- **Exclusiones acordadas:** Bode inverso (pp. 38–40) y los ejercicios de factor de amortiguamiento (pp. 41–43). Se mantienen los cálculos de respuesta temporal que pertenecen a Laplace.
- **Teoría de apoyo:** PID, compensadores y métodos de ajuste cuando expliquen una decisión de la práctica o el estudiante los consulte.
- **Entrada:** mostrar primero el índice, con selección de tema y dificultad. Sugerir B1 en nivel intermedio, con primer intento de cálculo libre. Ofrecer también nivel inicial y modo examen.
- **Material:** usar primero los originales. Las repeticiones del repaso son segundas referencias del mismo ejercicio cuando el circuito o modelo coincide. Las variantes inventadas quedan fuera del inventario y de sus criterios de finalización.

### Cómo ejecutar el plan con un solo agente

1. Leer esta guía y abrir el PDF en las páginas correspondientes a la fase. La fuente de enunciados, esquemas y procedimientos es el manuscrito. El catálogo siguiente facilita localizar los ejercicios, incluidos los que comparten página.
2. Ejecutar las fases en orden. La primera entrega que debe poder usar un estudiante es **B1 completo**, desde la normalización hasta la interpretación de márgenes. Completar ese recorrido antes de extender el tutor a los otros cuatro Bode.
3. Al cerrar una fase, actualizar la bitácora al final de este archivo. Registrar los IDs cubiertos, los cambios, la evidencia matemática y de interfaz, las preguntas pendientes y el siguiente paso concreto.
4. Si se interrumpe la sesión, retomar desde la primera condición de cierre pendiente. El avance del agente y los intentos del estudiante tienen registros separados.
5. Para una anotación ambigua, comparar el enunciado, el dibujo y las páginas de repaso. Si dos lecturas siguen siendo posibles y cambian la respuesta o el método, preguntar al usuario por **ese símbolo, signo o paso**, citando la página. Mientras tanto, continuar los ejercicios independientes.
6. Al terminar la implementación y la verificación, actualizar esta bitácora, hacer commit del tutor y del plan, y hacer push a `Francisrjs/LHR-Algebra-boole`.

## 2. Documentación de referencia

| Referencia | Uso durante la ejecución |
|---|---|
| PDF, p. 1 | Temario y distinción entre práctica y teoría. |
| PDF, pp. 2–14 | Convenciones de sumadores, derivaciones, señales, reducción de lazos, entradas y perturbaciones. |
| PDF, pp. 15–21 | Construcción de LGR, tabla de Routh, ganancia crítica y cruce del eje imaginario. |
| PDF, pp. 22–32 | Respuesta temporal, entradas, error, Laplace y tipo de sistema. |
| PDF, pp. 33–37 | Cinco ejercicios de Bode directo. Referencia para los trazos individuales, colores, sumas, ejes y lectura de márgenes. |
| PDF, pp. 44–56 | Teoría del primer y segundo parcial. Las pp. 50–56 incluyen compensadores, PID y ajuste de lazos. |
| PDF, pp. 57–64 | Repaso. Incluye casos nuevos y resoluciones alternativas que deben cotejarse con las primeras apariciones. |
| [Guía del proyecto](../README.md) y [arquitectura](../docs/ARQUITECTURA.md) | Arranque local, convenciones de ganancia, cálculo en Python, interfaz React y persistencia existente. |
| [Vistas](../docs/VISTAS.md), [API](../docs/API.md) y [pruebas](../docs/PRUEBAS.md) | Determinar qué cálculos, interacciones y verificaciones se pueden reutilizar sin exponer la solución. |

## 3. Inventario de los 33 ejercicios y ejemplos

Usar estos IDs en índice, fichas, historial y pruebas. La transcripción final de cada ejercicio debe cotejarse con la página indicada. Si una reaparición tiene datos distintos, conservar esa diferencia en la ficha.

### Bode directo · 5 ejercicios

En todos se practican magnitud, fase, cruces, MF y MG. Cada margen debe llevar frecuencia, unidad y origen del valor (lectura aproximada o evaluación exacta del modelo).

| ID | Pág. | Transferencia del apunte | Trabajo del estudiante |
|---|---:|---|---|
| B1 | 33 | \(10^5/[s(s+100)(s+1000)]\) | Normalizar, distinguir ganancia e integrador, fijar el tramo inicial y añadir dos polos simples. Ejercicio piloto. |
| B2 | 34 | \(10^6s(s+10)/[(s+1)^2(s+100)^2]\) | Comenzar con un cero en el origen, incorporar un cero simple y dos polos dobles. Seguir transiciones superpuestas y examinar todos los cruces. |
| B3 | 35 | \(10(s+1)/[s(s+10)^2]\) | Combinar integrador, cero simple y polo doble. Estudiar si el encuentro de la recta aproximada con −180° corresponde a un cruce exacto finito. |
| B4 | 36 | \(10^{-5}(s+10)(s+100)(s+1000)/s^3\) | Partir de tres integradores y sumar tres ceros. Conservar la fase continua desde el tramo inicial. |
| B5 | 37 | \(10^5s^2/[(s+10)(s+100)(s+1000)]\) | Arrancar con un cero doble en el origen, incorporar tres polos y analizar los cruces de una magnitud que primero sube y luego baja. |

### LGR y Routh-Hurwitz · 7 ejercicios

En el catálogo, \(L_0\) es la transferencia base. Para el LGR, aplicar la ganancia variable una sola vez mediante \(1+K L_0(s)=0\).

| ID | Pág. | Modelo o consigna | Trabajo del estudiante |
|---|---:|---|---|
| R1 | 16 | \(s^3+3s^2+2s+K=0\) | Armar la tabla, imponer las condiciones de la primera columna y estudiar el límite con el polinomio auxiliar. |
| L1 | 17 | Recuperatorio 2025, \(L_0=1/[s(s+1)(s+2)]\) | Pasar del esquema con G y H al lazo, dibujar ramas, elegir la ruptura válida y contrastar el cruce imaginario con Routh. |
| L2 | 18 | \(L_0=(s+2)/[s(s+1)(s+3)]\) | Identificar la rama que termina en el cero, construir asíntotas y filtrar candidatos a ruptura. |
| L3 | 19 | Parcial 2025, \(L_0=(s+3)/[s(s+1)(s+2)]\) | Determinar segmentos reales, estudiar candidatos de dK/ds = 0 y justificar el rango estable. |
| L4 | 20, 62 | \(L_0=(s+1)/[s(s+2)(s+3)]\) | Reconstruir el gráfico, contrastar la conclusión con Routh y usar la segunda aparición para repasar. |
| L5 | 21 | \(L_0=1/[s(s+1)(s+3)]\) | Relacionar centroide, ruptura, ganancia crítica y frecuencia de cruce. |
| L6 | 61 | \(L_0=1/[s(s+2)(s+3)]\) | Resolver el repaso y comprobar qué ocurre antes, en y después de la ganancia crítica. |

### Álgebra de bloques · 15 ejercicios y ejemplos

El dibujo forma parte de la consigna. Transcribir posición de las bifurcaciones, flechas y signos de **cada entrada** a los sumadores. En las páginas con dos ejercicios, conservar el orden de arriba abajo.

| ID | Pág. | Circuito y objetivo |
|---|---:|---|
| D1 | 2, penúltimo esquema | Dos ramas G₁ y G₂ con resta a la salida. Identificar el signo de cada señal. |
| D2 | 2, último esquema | Lazo con G₁ en la rama directa y G₂ en el retorno. Escribir las señales antes de cerrar el lazo. |
| D3 | 3, arriba | Tres bloques en serie y retorno H. Relacionar señales intermedias y obtener la transferencia. |
| D4 | 3, abajo | La referencia llega a más de un sumador. Seguir cada camino y obtener C/R. |
| D5 | 4, arriba | Ramas G₁ y G₂ y retorno con G₃ y G₄. Reconstruir primero la señal auxiliar. |
| D6 | 4, abajo | Bloque G, retorno H₁ y rama H₂. Identificar desde qué nodo se alimenta cada bloque. |
| D7 | 5–6 | G₁, G₂, G₃, H₁ y H₂. Trasladar un sumador, compensar el traslado y cerrar los lazos en el orden del apunte. |
| D8 | 7 | Circuito numérico con 5/(s+2), 1/s y ganancia 4. Mover el punto de toma y reducir el circuito cuidando los signos. |
| D9 | 8, arriba | Referencia R y perturbación D. Hallar las dos transferencias parciales anulando una entrada por vez. |
| D10 | 8–9, 58 | Parcial 2025 con K₁, K₂, K₃ y H₁. Reducir los lazos internos y verificar el signo del retorno exterior en el dibujo. |
| D11 | 10–11, 59–60 | Parcial 2023 con G₁ a G₄, K₁ y K₂. Relacionar el traslado de la toma con el factor del retorno. Conservar el desarrollo simbólico y la sustitución numérica. |
| D12 | 12, 58 | G₁, G₂ y dos retornos. Habilitar las dos resoluciones del apunte, por ecuaciones de señales y por reducción visual. |
| D13 | 13–14 | K₁ a K₄, integrador y perturbación N. Cubrir los incisos de C/R, C/N y error ante cada entrada, incluida la anulación del error mediante ganancias. |
| D14 | 57, arriba | Circuito con A, B y D. Distinguir lazos interior y exterior y conservar sus signos. |
| D15 | 57, abajo | Ramas H₂ y G, con retorno H₁. Verificar de qué nodo sale el retorno antes de combinar ramas. |

### Laplace y error estacionario · 6 ejercicios

| ID | Pág. | Consigna y método |
|---|---:|---|
| E1 | 26, 63 | Escalón de amplitud 100, G=1/(s+2), H=1/s. Obtener C/R, formar C(s), antitransformar y distinguir el error del comparador del error de seguimiento. |
| E2 | 27 | Escalón de amplitud K, G=1/s, H=1/(s+2). Polo repetido y fracciones simples. Aquí K representa la amplitud de entrada. |
| E3 | 28, 64 | Escalón de amplitud 10 y transferencia entrada–salida 1/[(s+1)(s+2)]. Hallar c(t) por fracciones simples y evaluar el error de seguimiento. |
| E4 | 29 | Transferencia **ya cerrada** 1/[s(s+2)], con escalón unitario. Identificar el término que determina si existe un valor final finito. |
| E5 | 30–31 | G=1/s, H=1/(s+1), escalón unitario. Cerrar el lazo, descomponer, completar cuadrados y reconocer las parejas seno y coseno. |
| E6 | 32 | Elegir el número de integradores para error nulo ante escalón, rampa y parábola. Contrastar el tipo que exige cada entrada con la estabilidad efectiva del lazo concreto. |

## 4. Fase 1 · Transcripción y verificación de la carpeta

**Objetivo:** disponer de una referencia docente que identifique cómo se resuelve cada consigna y qué respuestas se pueden aceptar.

1. Crear una ficha por ID con páginas, enunciado, incisos, datos, diagrama o ejes, orden de pasos manuscritos, respuesta esperada, unidades, precisión y verificación matemática. Separar las soluciones de referencia del contenido visible al estudiante.
2. En Bode, registrar primera frecuencia visible, quiebres, trazos individuales y sumas. Diferenciar anotaciones del manuscrito, aproximaciones gráficas y valores recalculados. En LGR y Routh, conservar el polinomio característico, las restricciones sobre K y el motivo para descartar una ruptura.
3. En bloques, resolver las ecuaciones del circuito **antes** de reducirlo y usarlas para verificar el equivalente. En Laplace, precisar qué transferencia se entrega, qué señal se aplica y qué diferencia se llama error. En E1 y E2 calcular por separado R−C y R−HC. En E4 y E6 comprobar las condiciones del teorema del valor final.
4. Clasificar cada discrepancia como aproximación del dibujo, error matemático o lectura ambigua. Preservar la consigna original y preparar la explicación para el paso correspondiente. Evitar penalizar una respuesta correcta que difiera de un error del manuscrito.

**Cierre:** 33 fichas localizables por página, incisos identificados y referencias de B1 listas para calificar todo su recorrido. Cada duda pendiente indica qué actividad afecta.

## 5. Fase 2 · Índice, sesión y motor de práctica

| Elemento | Comportamiento |
|---|---|
| Índice | Mostrar tema, ID, página, dificultad y estado. Abrir cualquier ejercicio disponible y reanudar el que estaba en curso. |
| Paso | Una consigna visible, una interacción, criterio de corrección, pista, explicación y cambio gráfico que se habilita al resolverlo. |
| Entrada | Admitir número, expresión corta, opción, factor, punto o bloque. Proporcionar alternativa por botón o campo a cada gesto gráfico esencial. |
| Inicial | Opciones breves y pistas disponibles. |
| Intermedio | Primer intento libre si se pide calcular. Ante un error, dar una pista concreta y permitir otro intento sobre el mismo paso. |
| Examen | Recoger una respuesta por paso y corregir al entregar. Ocultar durante el intento pistas, soluciones y trazos que revelen la respuesta. Si el paso siguiente depende del anterior, usar el valor ingresado o formular una pregunta independiente. |
| Solución solicitada | En práctica, revelar el paso actual por pedido explícito y registrarlo como asistido. Mostrar la resolución completa solo mediante una acción distinta y explícita. |
| Progreso | Guardar localmente ID, modo, paso, intentos, errores por concepto, ayudas y capas gráficas confirmadas. Recuperar al recargar. Repetir un ejercicio crea un intento nuevo. |
| Resumen | Mostrar fórmulas, decisiones, errores y conceptos a repasar. Distinguir completado sin ayuda, completado con ayuda y marcado para repaso. |

Aceptar coma y punto decimal, signos, unidades compatibles y expresiones equivalentes. Declarar en cada consigna si pide valor exacto, redondeo o lectura gráfica. En selecciones sobre el eje de frecuencia, calcular la tolerancia en escala logarítmica.

**Cierre:** iniciar B1, equivocarse, recibir una pista, reintentar y recargar en el mismo paso. La corrección y los controles auxiliares preservan la respuesta del paso siguiente.

## 6. Fase 3 · B1 completo y Bode por contribuciones

Consultar la [descomposición en factores](../backend/bode_factors.py), los [valores y tablas para el trazado manual](../frontend/src/bodeManual.ts) y la [vista de Bode](../frontend/src/BodeWorkspace.tsx). Reutilizar factores normalizados, multiplicidades, intervalos y transiciones. Para cada pregunta, decidir qué puede construir el alumno y qué trazos se habilitan tras su respuesta.

| Etapa | Acción del estudiante | Qué aparece al confirmar |
|---|---|---|
| 1. Normalización | Extraer las constantes de los binomios y calcular la ganancia normalizada. | La igualdad algebraica correspondiente al paso confirmado. |
| 2. Factores | Identificar ganancia, factor en el origen y polos finitos. | Una ficha por factor identificado, con símbolo y color estables. |
| 3. Magnitud individual | Para cada factor, indicar aporte, quiebre cuando exista y pendiente. Marcar un punto o elegir el tramo correcto. | El trazo individual. Las contribuciones anteriores siguen disponibles. |
| 4. Inicio de magnitud total | Para una primera frecuencia positiva y explícita, calcular los dB y la pendiente inicial. | El punto inicial y el primer tramo. Distinguir la línea de ganancia constante de la magnitud total con integrador. |
| 5. Suma por intervalos | En cada quiebre decidir qué factor actúa, cuánto cambia la pendiente y cuánto vale la suma. | Una fila de la tabla de intervalos y el nuevo tramo, continuo desde el nivel alcanzado. |
| 6. Fase individual | Identificar el aporte de ganancia y factores en el origen. Para cada polo finito marcar inicio, centro y fin de transición. | Una contribución individual de fase. Usar grados para ángulos y grados/década para pendientes. |
| 7. Inicio y suma de fase | Indicar el ángulo inicial total y sumar aportes en los límites de cada transición. | La suma parcial y las transiciones superpuestas, conservando la rama de fase del ejercicio. |
| 8. Márgenes gráficos | Elegir un cruce y leer el otro gráfico a la misma frecuencia. | Marcadores vinculados. Una vez identificado el cruce, trabajar la fórmula correspondiente. |
| 9. Contraste exacto | Comparar las rectas con la evaluación de la transferencia en jω. | Curva exacta, valores de referencia y diferencia respecto de la aproximación. |
| 10. Interpretación | Explicar brevemente qué significan los márgenes obtenidos. | Fórmulas, correcciones y repaso sugerido a partir de este intento. |

### Reglas de dibujo y referencias para las pruebas

- Diferenciar contribución individual, suma parcial y total confirmado con leyenda y estilo de línea además de color. Usar la misma identificación para cada factor en magnitud y fase. Permitir recuperar pasos anteriores sin borrar construcciones aceptadas.
- En magnitud, sumar aportes en dB a una misma frecuencia. Para un tramo usar M₂ = M₁ + m·log₁₀(ω₂/ω₁), con m en dB/década. Preguntar por separado qué elemento actúa, cuál es su aporte y por qué cambia la pendiente.
- Para los factores reales finitos del inventario, construir la transición manual de fase entre ωb/10 y 10ωb, con punto medio en ωb. Aplicar signo y multiplicidad. Un factor en el origen aporta fase constante. Cuando se superponen transiciones, sumar los aportes activos.
- Para el margen de fase, localizar un cruce de 0 dB y leer su fase. Para el de ganancia, localizar un cruce de fase equivalente a −180° y leer allí la magnitud. En la convención usual, MF = 180° + φ(ωgc) en la rama referida a −180°, y MG en dB = −M(ωpc). Examinar todos los cruces, su sentido y frecuencia. Distinguir un resultado finito, la ausencia de cruce y un valor indefinido conforme al modelo y la convención usada.
- **Control interno B1:** ganancia normalizada 1. Si se fija ω inicial en 0,01 rad/s, la magnitud asintótica inicial vale 40 dB, con pendiente −20 dB/década y fase inicial asintótica −90°. Estos valores sirven para probar la implementación y se revelan al estudiante en los pasos correspondientes.

**Cierre:** completar B1 en pantalla móvil. Equivocarse, pedir pista, cambiar de gráfico y recargar conserva los trazos aceptados. Revisar también leyendas, tablas, ventanas de información y marcadores para evitar que anticipen respuestas.

## 7. Fase 4 · Completar Bode directo con B2–B5

- **B2:** trabajar multiplicidad y superposición. Verificar independientemente la afirmación manuscrita sobre márgenes y estabilidad. Si se pregunta por el lazo cerrado, explicitar el cierre y comprobar los polos característicos.
- **B3:** preguntar si existe un cruce exacto finito de fase. Contrastar con la aproximación que llega a −180°.
- **B4:** conservar la referencia inicial de los tres integradores. Verificar que la representación de fase mantenga visible la suma enseñada aunque exista un ángulo equivalente módulo 360°.
- **B5:** permitir estudiar más de un cruce de 0 dB y leer la fase correspondiente a cada uno.
- Para cada modelo, verificar que los factores reconstruyen la transferencia original, comprobar puntos a ambos lados de los quiebres y contrastar los márgenes mediante evaluación compleja independiente del trazo.

**Cierre:** B1–B5 ofrecen cinco recorridos completos desde ejes vacíos hasta interpretación. En los cinco, el estudiante puede reconstruir magnitud y fase y distinguir lectura aproximada, valor exacto y ausencia de cruce finito.

## 8. Fase 5 · Routh-Hurwitz y LGR

**Orden de implementación:** R1, L1, L2, L3, L4, L5, L6. El alumno puede elegir otro desde el índice.

1. En R1 pedir polinomio, dos filas iniciales, celdas calculadas, condiciones de la primera columna y rango estable. En el límite construir el auxiliar y distinguir la frecuencia real ωc de las posiciones s = ±jωc.
2. En LGR comenzar con el plano vacío. Ubicar polos y ceros, marcar segmentos reales, calcular asíntotas y centroide, estudiar dK/ds = 0 y dibujar las ramas progresivamente. Exigir que el candidato a ruptura pertenezca a un segmento del lugar y corresponda a un K admisible.
3. Vincular el cruce imaginario con la ecuación característica y la tabla de Routh. Habilitar la práctica independiente de la parte de Routh de un LGR. Reutilizar los cálculos del laboratorio y controlar cuándo se ven filas, ramas, rótulos y valores.

**Cierre:** todos los casos permiten justificar segmentos, rupturas y estabilidad. Como prueba independiente de L5, comprobar centroide −4/3 y cruce en ±j√3 para K = 12. En la interfaz aparecen en pasos distintos.

## 9. Fase 6 · Álgebra de bloques visual

**Orden:** D1–D6 para señales y operaciones elementales, D7–D12 para traslados y lazos, D13 para perturbación y error, D14–D15 para repaso.

1. Recrear los 15 esquemas del PDF con nodos distinguibles y flechas seleccionables. En celular, ofrecer una lista de elementos cuando dos conexiones estén demasiado cerca.
2. En cada transformación, seleccionar componentes y operación y completar la expresión relevante. Mostrar el diagrama resultante y el historial de los pasos aceptados.
3. En un traslado, preguntar qué señal debe conservar su valor. En realimentación, identificar el signo del sumador antes de pedir el denominador. En D9 y D13 indicar qué entrada permanece activa.
4. En D12 habilitar los dos métodos originales. En D11 conservar los esquemas anterior y posterior al traslado. Verificar cada transformación frente a las ecuaciones de las entradas y salidas pertinentes.
5. Reutilizar el editor y solucionador existentes donde representen el circuito fielmente. Confirmar topología y signos antes de reutilizar ejemplos del laboratorio.

**Cierre:** los 15 diagramas pueden reconstruirse y resolverse paso a paso. Incluir comprobaciones capaces de detectar un signo invertido y un retorno conectado al nodo equivocado.

## 10. Fase 7 · Laplace, error estacionario y teoría de apoyo

- **E1–E3:** identificar la transferencia, transformar la entrada, formar C(s), elegir la descomposición y obtener c(t). Alternar cálculo, selección de parejas de Laplace e interpretación de la salida.
- **E4:** reconocer la transferencia ya cerrada y analizar la existencia del límite antes de usar el teorema del valor final.
- **E5:** guiar el completado del cuadrado y la reescritura del numerador. Aceptar expresiones temporales algebraicamente equivalentes.
- **E6:** resolver escalón, rampa y parábola por separado. Evaluar el tipo formal y después comprobar si la estabilidad permite concluir sobre el error estacionario.
- **Teoría breve:** incluir las páginas 44–56 cuando expliquen una decisión. Ejemplos: acción integral y error permanente, adelanto de fase y margen, diferencia entre ajuste en lazo abierto y cerrado. Mantener estas actividades fuera del conteo de originales.

**Cierre:** los seis ejercicios llegan al resultado por el procedimiento manuscrito. La corrección distingue C/R, R−C y R−HC y comprueba las condiciones de existencia del régimen permanente.

## 11. Fase 8 · Seguimiento, examen y aceptación final

### Registro y repetición

- Etiquetar errores por ejercicio y concepto, por ejemplo normalización, dB frente a dB/década, cruce elegido, signo de retorno o uso del valor final. Al terminar, ofrecer repetir el paso o reiniciar el original conservando el intento anterior.
- Presentar pendientes, en curso, completados y señalados para repaso. Mostrar por separado resultado de examen y ayudas usadas en práctica. Verificar que doble toque, recarga y cambio de orientación no dupliquen intentos.

### Uso desde el celular

- Probar a 360 y 390 píxeles de ancho. Mantener accesible la consigna mientras se opera el gráfico. Verificar toque y alternativa mediante campos para frecuencias logarítmicas, polos cercanos, celdas de Routh y retornos de bloques.
- El lanzador actual escucha en 127.0.0.1. Ofrecer un arranque opcional para la red local que indique la dirección accesible desde el teléfono y conservar el inicio local habitual. Registrar por separado lo comprobado en emulación y lo comprobado en un teléfono físico cuando esté disponible.

### Matriz de aceptación

| Control | Evidencia requerida |
|---|---|
| Cobertura | 33 IDs únicos con páginas e incisos. Reapariciones vinculadas y exclusiones respetadas. |
| Matemática | Referencia independiente para cada ejercicio y discrepancias con el manuscrito documentadas. |
| Bode | Los cinco recorridos incluyen contribuciones individuales, inicio del total, acumulación, fase, cruces y márgenes. Las ayudas emergentes y tablas respetan el paso activo. |
| Interacción | Error conserva el paso. Acierto confirma una sola etapa. Las ayudas quedan registradas. |
| Examen | Corrección al entregar y revisión de cada respuesta. Los pasos dependientes no revelan resultados durante el intento. |
| Persistencia | Recargar recupera ejercicio, paso, errores y trazos. Repetir conserva historial. |
| Compatibilidad | Las vistas previas y los proyectos guardados de ControlLab siguen funcionando. |
| Verificación técnica | Ejecutar pruebas Python, pruebas del frontend, compilación y pruebas de navegador. Añadir casos dirigidos a las nuevas interacciones y registrar resultados reales. |

**Definición de terminado:** cualquier ID del índice puede iniciarse desde la consigna original, completarse mediante selecciones o respuestas cortas, revisarse y reanudarse desde el celular. Documentar qué se probó, las discrepancias del apunte y cualquier comprobación pendiente. El alumno conserva el control sobre cuándo avanzar o solicitar la solución.

## 12. Bitácora para continuar la ejecución

Actualizar al término de cada fase. En «Evidencia» anotar fichas, pruebas o resultados concretos. Si el trabajo queda a mitad de fase, consignar el ID y el paso exacto para retomarlo.

| Fase | Estado | Evidencia, dudas y siguiente paso |
|---|---|---|
| 1 · Fuente y fichas | Completada | [33 fichas de referencia](../docs/TUTOR_REFERENCIAS.md) con páginas, ecuaciones y discrepancias. Los criterios y las tolerancias por paso están en los módulos del tutor. Se cotejaron las reapariciones y se conservaron los datos alternativos de D11. |
| 2 · Índice y sesión | Completada | Índice con tema, modo, página y estado. B1 propone Intermedio con respuesta libre. La prueba de navegador comprueba error, pista, doble envío, cambio de gráfico y recuperación tras recarga. |
| 3 · B1 completo | Completada | Construcción desde ejes vacíos hasta márgenes y estabilidad, con factores, tramos, tabla, marcadores y comparación exacta. Prueba de navegador de principio a fin con cambio de 360 a 390 px. Anclas de referencia: 40 dB a 0,01 rad/s, −20 dB/década y −90°. |
| 4 · B2–B5 | Completada | Recorridos completos por contribuciones. Se cotejaron los cruces con el cociente de polinomios evaluado en jω y las raíces de D+N. B2 corrige la estabilidad indicada por las rectas, B3 distingue la meseta del límite exacto, B4 conserva −270° y B5 tiene dos cruces de 0 dB. |
| 5 · Routh y LGR | Completada | R1 y L1–L6 incluyen celdas de Routh, segmentos, rupturas, asíntotas y estabilidad. Routh puede practicarse de forma independiente. El navegador verificó examen R1 y el avance de L5 hasta K=12 y ±j√3; el test de frontend comprueba el centroide −4/3 en una etapa distinta. |
| 6 · Bloques | Completada | D1–D15 con diagramas y signos. Se comprobaron equivalentes por ecuaciones nodales, incluida la inversión del retorno de D10 y la toma de D15. D11 conserva los esquemas antes y después del traslado. D12 admite ambos métodos. |
| 7 · Laplace y error | Completada | E1–E6 con entrada, respuesta, o comprobación de estabilidad según la consigna. Se verificaron E1–E5 por transformada directa con SymPy, y E6 por Routh y raíces. El navegador completó E3 con una forma equivalente de c(t). |
| 8 · Seguimiento y aceptación | Software verificado | 394 pruebas Python y 52 de frontend, compilación, y las tres suites de navegador (`smoke`, `acceptance` y `tutor`). Pasaron persistencia, repaso, corrección al entregar y compatibilidad de proyectos. `--lan` respondió por la IPv4 de la PC. Queda pendiente la prueba en un teléfono físico. |

La prueba del tutor se ejecuta junto con las regresiones mediante `npm.cmd --prefix e2e test`, con ControlLab iniciado. La suite deja capturas de 360 y 390 px en `e2e/artifacts/`.
