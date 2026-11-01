# Verificación del MVP

Fecha local: 31 de octubre de 2026.

Se ejecutaron las suites `e2e/smoke.cjs` y `e2e/acceptance.cjs` con Chrome en modo headless, ventana de 1600 × 1000 y recursos servidos desde el lanzador Python local. Las solicitudes a hosts externos se bloquearon durante ambas suites. No hubo solicitudes externas ni excepciones JavaScript.

## Flujos comprobados en navegador

- Bode inicial y navegación por las cinco vistas.
- Conversión G/H a GH manteniendo las curvas con K distinto de uno.
- Conversión explícita de una función parametrizada a coeficientes, arrastre con mouse de un polo complejo y dos operaciones Deshacer que recuperan la expresión parametrizada.
- Proyecto guardar, abrir y volver a guardar: contenido JSON idéntico.
- Exportaciones PNG y SVG de Bode, incluyendo magnitud y fase.
- Álgebra: editar operandos, elegir paralelo, calcular, guardar, crear proyecto nuevo y recuperar operandos y operación al abrir el archivo.
- Historial algebraico conservado y envío de la equivalente al analizador.
- Restaurar el último proyecto guardado después de cambiar K.
- Rangos de zoom guardados y recuperados mediante proyecto JSON.
- Expresión incompleta: error visible y conservación del último gráfico correcto.
- Respuestas al escalón, rampa e impulso con valores finitos.
- GH directo: restricción de respuesta temporal hasta aceptar explícitamente el equivalente H=1.
- Modelos de órdenes 6 y 8 con respuesta en frecuencia válida.

## Rendimiento observado

Diez cambios consecutivos de K en el modelo inicial, medidos desde el evento de entrada hasta la resolución de `Plotly.react`, incluyendo el debounce de 150 ms: mediana **218,6 ms**, máximo **241,1 ms**. Son mediciones del equipo de esta sesión y de ese modelo; no constituyen una garantía universal de latencia para cualquier función u ordenador.

En el modelo de orden 6 `1/((s+1)(s+2)(s+3)(s+4)(s+5)(s+6))`, 30 cambios de K dieron mediana **220,9 ms**, percentil 95 **235,6 ms** y máximo **237 ms**. Todas las muestras quedaron por debajo de 300 ms. Esta medición reproducible se ejecuta con `node e2e/performance.cjs`.

Las capturas y archivos de prueba se guardan al ejecutar las suites en `e2e/artifacts/`. Las comprobaciones numéricas independientes están en las pruebas pytest del núcleo; los gráficos del navegador no se utilizan como oráculo de precisión numérica.
