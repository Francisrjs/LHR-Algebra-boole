# PRD — Laboratorio Interactivo de Sistemas de Control

**Versión:** 1.1 (alcance actualizado)  
**Fecha:** 31 de octubre de 2026  
**Estado:** Propuesta funcional; sin stack definitivo ni implementación

## 1. Visión del producto

Aplicación local e interactiva para explorar sistemas de control continuos, lineales e invariantes en el tiempo (LTI), principalmente SISO. El usuario ingresará funciones de transferencia, modificará parámetros y observará automáticamente cambios en el Lugar Geométrico de las Raíces (LGR), polos, ceros, estabilidad y respuesta temporal. Un módulo separado permitirá realizar álgebra de bloques **mediante expresiones y operaciones**, sin editor visual de conexiones en el MVP.

**Prioridad de la primera etapa:** LGR y álgebra de bloques. La respuesta temporal y el plano de polos y ceros complementan la exploración y ayudan a interpretar los resultados.

## 2. Decisiones confirmadas

- **Entrada principal:** funciones de transferencia, no editor gráfico de bloques.
- **Modos de entrada obligatorios:** ingresar **G(s) y H(s) por separado** o ingresar directamente **L(s) = G(s)H(s)**.
- **Actualización:** automática cuando se modifican coeficientes, parámetros o ganancias válidos; para texto incompleto se conserva el último modelo correcto.
- **Interacción gráfica:** seleccionar y arrastrar polos y ceros con reglas de consistencia matemática.
- **Álgebra de bloques:** operaciones manuales asistidas primero; automatización avanzada después.
- **Persistencia:** guardar y abrir proyectos locales; exportar gráficos PNG/SVG.
- **Plataforma:** Windows local; código editable desde Cursor y Codex.
- **PathView:** evaluación diferida para la futura versión con diagramas de bloques visuales. No es dependencia del MVP.
- **Stack:** todavía no elegido.

## 3. Distinción matemática imprescindible: G, H, GH y T

La aplicación **no debe tratar G(s), H(s) y G(s)H(s) como entradas indistinguibles**.

Para una configuración estándar de **realimentación negativa**, con referencia R(s), salida C(s) y trayectoria directa G(s):

- **Trayectoria directa:** `G(s)`.
- **Retroalimentación:** `H(s)`.
- **Transferencia de lazo (loop transfer):** `L(s) = G(s)H(s)`.
- **Transferencia de referencia a salida:** `T(s) = C(s)/R(s) = G(s)/(1 + G(s)H(s))`.
- **Ecuación característica:** `1 + G(s)H(s) = 0` (interpretada tras formar el polinomio característico, cuidando cancelaciones y casos singulares).

Si H(s)=1, entonces `T(s) = G(s)/(1+G(s))`. Para realimentación positiva se invierte el signo en el denominador, cuando el usuario la seleccione en una versión que la soporte.

### 3.1 Modo A — G(s) y H(s) por separado (MVP)

**Entradas:** G(s), H(s); ambas editables. H(s)=1 como valor inicial. El usuario puede cambiar las ganancias y demás parámetros de ambas funciones.

**Cálculos disponibles:**

- L(s) = G(s)H(s).
- T(s) = G(s)/(1+G(s)H(s)) para realimentación negativa.
- Polos y ceros de G, H, L y T, etiquetados por cada representación.
- LGR de `K·L₀(s)` (véase definición de ganancia variable).
- Respuesta temporal de T(s) a la entrada seleccionada.
- Comparación con la respuesta de G(s), cuando se elija expresamente lazo abierto.

### 3.2 Modo B — GH(s) directo (MVP)

**Entrada:** una única expresión `L(s) = G(s)H(s)`; la aplicación **no infiere** por defecto G ni H individualmente.

**Cálculos disponibles:**

- Polos y ceros de L(s).
- LGR, ecuación característica y polos del sistema asociado a `1 + K·L₀(s) = 0`.
- Transferencia complementaria `L(s)/(1+L(s))`, **identificada explícitamente como transferencia de lazo cerrado para el caso particular de trayectoria directa L y retroalimentación unitaria**, no como `C/R` original sin conocer G y H.

**Limitación crítica:** conocer GH solamente **no alcanza para calcular de forma única** `T(s)=G(s)/(1+G(s)H(s))`. La aplicación mostrará esta advertencia y pedirá G(s), o un supuesto explícito H(s)=1, antes de presentar la respuesta real `C(t)` ante `R(t)` para el sistema original.

**Conversión de modos:**

- De G/H a GH: automática, pero se mantienen los valores originales para volver al modo separado.
- De GH a G/H: no automática; requiere que el usuario proporcione una descomposición o acepte expresamente `H(s)=1, G(s)=L(s)` como un **nuevo supuesto de modelo**.

### 3.3 Convención de K y LGR

Para evitar duplicación de ganancias se define una **ganancia de barrido K** y una **transferencia base L₀(s)**; el LGR se calcula desde `1 + K·L₀(s) = 0`, con K≥0 en el MVP.

- Una ganancia fija incluida en G o H forma parte de L₀; el usuario puede editarla separadamente.
- El slider K es el factor variable de exploración, aplicado **una sola vez** a L₀.
- En modo G/H, por defecto K se inserta en la trayectoria directa: `G_K = K·G₀` y `L_K=K·G₀·H`, por lo que `T_K=K·G₀/(1+K·G₀·H)`.
- En modo GH solamente, se pueden calcular LGR y polos de la ecuación característica para K, pero no adjudicar una `T_K=C/R` única al sistema original.
- La UI indicará siempre qué transferencia y qué K está graficando.

## 4. Alcance funcional del MVP

### M1 — Editor de funciones de transferencia

| ID | Requisito |
|---|---|
| RF-01 | Alternar entre modo **G y H separados** y modo **GH directo**. |
| RF-02 | Ingresar expresiones racionales factorizadas o expandidas y, cuando convenga, coeficientes polinómicos. |
| RF-03 | Admitir parámetros editables y ganancias fijas, separados del barrido K. |
| RF-04 | Mostrar G, H, L=GH y T cuando puedan determinarse sin ambigüedad. |
| RF-05 | Elegir la representación a inspeccionar (G/H/L/T según disponibilidad). |
| RF-06 | Utilizar retroalimentación negativa como convención inicial; H=1 predeterminada en modo separado. |
| RF-07 | Validar entrada, singularidades, orden y cancelaciones de polos/ceros; no ejecutar expresiones arbitrarias como código. |
| RF-08 | Recalcular tras cambios válidos y conservar último resultado correcto mientras se edita. |

### M2 — Plano complejo de polos y ceros

| ID | Requisito |
|---|---|
| RF-09 | Dibujar e identificar polos (×) y ceros (○), con leyenda y distinción G/H/L/T. |
| RF-10 | Seleccionar elementos y consultar coordenadas reales e imaginarias. |
| RF-11 | Arrastrar polos/ceros **del modelo base seleccionado** y reconstruir su polinomio correspondiente. |
| RF-12 | Preservar pares complejos conjugados para coeficientes reales. |
| RF-13 | Mostrar la estabilidad de la transferencia seleccionada e identificar casos límite. |
| RF-14 | Restablecer y deshacer cambios gráficos. |

**Regla UX:** los polos de lazo cerrado generados al variar K se muestran como resultados y no se arrastran libremente en el MVP; si se desea cambiar su ubicación se modifica el modelo base o K. El usuario verá explícitamente qué conjunto es editable.

### M3 — Lugar Geométrico de las Raíces

| ID | Requisito |
|---|---|
| RF-15 | Mostrar LGR para `1+K·L₀(s)=0` desde el modelo correspondiente. |
| RF-16 | Dibujar polos y ceros de L₀, ramas y polos para K seleccionado. |
| RF-17 | Slider y campo numérico para K, con actualización automática. |
| RF-18 | Mostrar asíntotas, ángulos, centroide y segmentos reales aplicables. |
| RF-19 | Mostrar puntos de ruptura válidos y cruces con eje imaginario cuando existan. |
| RF-20 | Mostrar coordenadas de polos cerrados y estado de estabilidad para K seleccionado. |
| RF-21 | Zoom, desplazamiento, selección y exportación de la gráfica. |

### M4 — Respuesta temporal (complementario al LGR)

| ID | Requisito |
|---|---|
| RF-22 | Graficar respuesta al escalón unitario de T=C/R solo si T está definida. |
| RF-23 | Graficar impulso y rampa para modelos compatibles. |
| RF-24 | Modificar duración, escala y amplitud; mostrar entrada y salida. |
| RF-25 | Mostrar valor final y métricas transitorias únicamente si son aplicables. |
| RF-26 | En modo GH directo, solicitar la descomposición G/H o advertir si se opta por un sistema equivalente bajo H=1. |

### M5 — Álgebra de bloques **sin editor de diagramas**

| ID | Requisito |
|---|---|
| RF-27 | Ingresar dos o más funciones de transferencia etiquetadas. |
| RF-28 | Combinar funciones en serie: `G_eq=G1·G2`. |
| RF-29 | Combinar en paralelo: `G_eq=G1+G2` o resta explícita. |
| RF-30 | Calcular realimentación negativa: `G_eq=G/(1+GH)`, identificando G y H. |
| RF-31 | Mostrar expresión de partida, operación aplicada y expresión equivalente simplificada. |
| RF-32 | Enviar una función equivalente al analizador principal conservando la operación original en el historial del proyecto. |

**Fuera del MVP:** conectar nodos, dibujar líneas, mover sumadores y puntos de toma, reducción automática de topologías arbitrarias.

### M6 — Persistencia y exportación

| ID | Requisito |
|---|---|
| RF-33 | Crear, guardar y abrir proyectos locales, con esquema de archivo versionado. |
| RF-34 | Recuperar modo G/H o GH, parámetros, K, funciones y configuración de gráficos. |
| RF-35 | Exportar gráficos PNG y SVG con ejes, escalas y leyendas. |
| RF-36 | Guardar historial de operaciones algebraicas y permitir restaurar el último modelo guardado. |

## 5. Experiencia de usuario propuesta

**Pantalla LGR (principal):**

1. **Panel izquierdo — Modelo:** selector `G(s) y H(s)` / `GH(s)`; campos matemáticos; ganancia de barrido K; selector del modelo a inspeccionar.
2. **Centro — Visualización:** LGR interactivo y plano de polos/ceros, con pestañas; marcadores distintos para polos abiertos, cerrados y ceros.
3. **Panel derecho — Análisis:** tabla de polos/ceros de la representación seleccionada, estabilidad, asíntotas, centroide, rupturas, cruces del eje y explicaciones resumidas.
4. **Panel inferior o pestaña secundaria — Respuesta temporal:** escalón/impulso/rampa vinculados al modelo que realmente define C/R.
5. **Vista Álgebra de bloques:** entradas de funciones, operación elegida, desarrollo y botón para enviar la equivalente al LGR.

**Principio:** ningún gráfico debe presentar un resultado de `T(s)` como si se conociera cuando el usuario solo ingresó `G(s)H(s)`.

## 6. Requisitos no funcionales

| ID | Requisito | Criterio sugerido |
|---|---|---|
| RNF-01 | Aplicación local en Windows 11 | Se ejecuta sin servicios externos luego de instalar dependencias. |
| RNF-02 | Uso sin conexión | Edición, cálculo, gráficos, guardar y abrir funcionan offline. |
| RNF-03 | Interacción fluida | Meta inicial: actualización visible inferior a 300 ms en casos de prueba hasta orden 6; validar en hardware real. |
| RNF-04 | Precisión reproducible | Coincidencia con casos analíticos dentro de tolerancias documentadas. |
| RNF-05 | Modelado matemático consistente | Distinguir G, H, L y T; etiquetar ganancias y condiciones de lazo. |
| RNF-06 | Diseño modular | Separar parser, núcleo de cálculo, visualización, álgebra y persistencia. |
| RNF-07 | Control de errores | Nunca reemplazar el último modelo válido por una expresión inválida. |
| RNF-08 | Usabilidad | Zoom, cursores, leyendas, ejes con unidades y valores numéricos accesibles. |
| RNF-09 | Compatibilidad de desarrollo | Proyecto local mantenible con Cursor y Codex. |
| RNF-10 | Seguridad local | No usar ejecución indiscriminada (`eval`) de expresiones del usuario. |
| RNF-11 | Tolerancia a fallas | Simulaciones problemáticas deben informar el error sin bloquear la interfaz. |
| RNF-12 | Portabilidad de proyectos | Formato versionado y validable para modelos y preferencias. |

## 7. Criterios de aceptación del MVP

### CA-01 — Ejercicio de respuesta temporal con G y H separados

- Ingresar `G(s)=1/((s+1)(s+2))`, `H(s)=1`, realimentación negativa y `K=1`.
- Mostrar `L(s)=1/((s+1)(s+2))`.
- Mostrar `T(s)=1/(s²+3s+3)` y polos cerrados `-1.5 ± j√3/2`.
- Respuesta al escalón con valor final `1/3`.
- Comparar la curva con el resultado analítico del resumen, con tolerancia absoluta `1e-4` en tiempos de prueba.

### CA-02 — Mismo LGR con modos de entrada diferentes

- Modo separado: `G(s)=1/[s(s+1)(s+3)]` y `H(s)=1`.
- Modo directo: `L(s)=G(s)H(s)=1/[s(s+1)(s+3)]`.
- Confirmar que ambos generan **el mismo LGR** y la misma ecuación característica `s³+4s²+3s+K=0`.
- Mostrar polos abiertos `0,-1,-3`, 3 ramas, centroide `-4/3`, asíntotas 60°,180°,300°.
- Para `K=12` mostrar cruce `±j√3` y estabilidad límite.

### CA-03 — GH solo no determina la salida C/R original

- Ingresar solamente `L(s)=1/((s+1)(s+2))`.
- El LGR y los polos cerrados deben estar disponibles.
- La respuesta temporal de `C/R` **no debe declararse determinada**.
- Mostrar opción de suministrar G/H o establecer explícitamente `H=1` para construir un modelo equivalente.

### CA-04 — G y H no unitarios

- Ingresar `G(s)=2/(s+1)` y `H(s)=3/(s+2)`, con barrido K=1.
- Mostrar `L(s)=6/[(s+1)(s+2)]`.
- Mostrar `T(s)=2/[(s+1)(s+2)+6]=2/(s²+3s+8)`.
- Verificar que no se sustituya erróneamente `T=L/(1+L)`.

### CA-05 — Interacción de polos y ceros

- Arrastrar un polo de G o H en modo separado: actualizar la función editada, L y T.
- Para polos conjugados, actualizar ambos para mantener coeficientes reales.
- Mantener los polos cerrados como marcadores de solo lectura vinculados a K.
- Restaurar el estado original sin perder el archivo guardado.

### CA-06 — Álgebra de bloques manual

- Ingresar `G1=1/(s+1)` y `G2=1/(s+2)`.
- Reducción en serie entrega `1/[(s+1)(s+2)]`.
- Reducción en paralelo entrega `(2s+3)/[(s+1)(s+2)]`.
- Realimentación negativa de `G1` con `H=G2` entrega `G1/(1+G1G2)`.
- Cada operación conserva explicación y puede enviarse al analizador.

### CA-07 — Guardado y exportación

- Guardar proyecto con modo separado, G/H, K, gráfico y operación algebraica.
- Abrirlo y verificar equivalencia de modelo, resultados y ajustes.
- Exportar LGR en PNG y SVG correctamente rotulados.

### CA-08 — Entradas inválidas

- Introducir denominador nulo o expresión incompleta.
- Mostrar un error específico sin ejecutar código del usuario ni destruir el último modelo válido.

## 8. Exclusiones y versiones futuras

### V1.1 — Análisis complementario

- Bode interactivo: magnitud, fase, frecuencias de quiebre y márgenes.
- Routh-Hurwitz explicado, ganancia crítica y tabla.
- Error de estado permanente (`Kp`, `Kv`, `Ka`).
- Nyquist y comparación de múltiples modelos, si resultan prioritarios.

### V2 — Diagramas de bloques visuales

- Editor de nodos conectables con sumadores, puntos de toma, ganancias y funciones de transferencia.
- Reducción manual visual de conexiones y transformaciones de puntos de suma y toma.
- Evaluación de PathView/PathSim para integrar o extender, dependiendo de compatibilidad y mantenimiento.
- Reducción automática de diagramas compatibles, después de validar el editor manual.

### Fuera de alcance inicial

- Recrear todo Simulink, hardware en tiempo real, controladores embebidos, sistemas MIMO y no lineales, interpretación automática de imágenes de ejercicios.

## 9. Secuencia de trabajo sugerida (sin programar todavía)

1. Definir contratos matemáticos y modelos internos para G, H, L, T y la ganancia de barrido.
2. Diseñar las pantallas y los estados de entrada G/H frente a GH directo.
3. Validar los criterios CA-01 a CA-08 como especificación de pruebas.
4. Comparar Python y MATLAB según precisión, gráficos interactivos, experiencia local e integración con Codex.
5. Elegir el stack del MVP sin condicionar la solución a PathView.
6. Planificar la implementación del núcleo, LGR, manipulación de polos, álgebra y persistencia.

## 10. Definición de terminado

El MVP queda aceptado cuando el usuario pueda ingresar **G y H separados o GH directamente**, construir y explorar el LGR sin ambigüedades, editar polos/ceros compatibles, realizar operaciones algebraicas de bloques sin editor visual, consultar la respuesta temporal únicamente cuando corresponda, guardar proyectos y exportar sus gráficos. Los casos CA-01 a CA-08 deberán superar las pruebas documentadas.
