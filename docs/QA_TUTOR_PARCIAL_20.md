# QA del parcial de 20 ejercicios

Base remota verificada con `git fetch origin` en la revisión `02aed944a167900e32df2f0e53405ad9e70c3623`. La verificación del parcial usa el árbol de trabajo de Windows con Python 3.13, Node 26 y Chrome mediante Playwright. Al comenzar había cambios locales del Tutor y documentación de sesión, incluido B6. Las pruebas del catálogo de trabajo esperan 33 fichas originales, B6 y las 20 nuevas.

## Corridas

| Fecha | Comando | Resultado |
|---|---|---|
| 2026-11-19 | `git status --short` y `git rev-parse HEAD origin/main` | HEAD y origin/main en la misma revisión. Cambios previos en el Tutor y archivos locales sin seguimiento. |
| 2026-11-19 | `node e2e/tutor.cjs` en la base servida en 8765 | Pasó el recorrido de 34 IDs. |
| 2026-11-19 | `.\verificar.cmd` | 394 pruebas Python, 58 de frontend y compilación de producción correctas. |
| 2026-11-19 | `python -` con SymPy, NumPy y SciPy | Cinco transformadas y límites, cinco respuestas de lazo en jω y cinco modelos D+KN contrastados de forma independiente. |
| 2026-11-19 | `npm.cmd --prefix e2e test` con `CONTROLLAB_URL=http://127.0.0.1:8766` | Pasaron smoke, aceptación, Tutor y las 20 fichas nuevas. |
| 2026-11-19 | `git diff --check` y comprobación de rutas y anclas Markdown | Diff sin errores de espacios y 81 enlaces del parcial válidos. |

Los límites críticos dieron `(s+9)(s²+23)` en P4.1, `(s²+1)(s²+6s+10)` en P4.4 y `(s+3)(s²+8)` en P4.5. Los tres cierres son estables al 90 % del K crítico y tienen dos polos en el semiplano derecho al 110 %. P4.2 y P4.3 se contrastaron en K=0,01, 1, 100 y 10000. Su primera columna positiva justifica la estabilidad para todo K>0.

La corrida base dentro del sandbox encontró un error de acceso a la configuración de Vite. La verificación completa se ejecutó fuera de esa restricción. Durante la integración se corrigieron la pérdida de precisión al mostrar algunas respuestas de asistencia y la omisión de las curvas exactas en el gráfico de Bode. El build emitió la advertencia de tamaño de bundle de Vite y las pruebas Python emitieron una advertencia de deprecación de Starlette al usar HTTPX.

## Resultados por ficha

Las 20 fichas llegaron al resultado en Playwright, con 55 respuestas de control externas a los objetos de la interfaz y al menos un distractor rechazado por ficha. El recorrido usa «Resolver este paso» en los demás pasos. El catálogo, las tolerancias y las referencias son reproducibles con [tutor.test.ts](../frontend/src/tutor/tutor.test.ts) y [tutor-partial.cjs](../e2e/tutor-partial.cjs). Las capturas se generan en `e2e/artifacts/` al correr Playwright.

### P1.1

Página 1. Eliminación nodal de la topología original y de cada reducción. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p11). Evidencia local en `e2e/artifacts/tutor-P1.1.png`.

### P1.2

Página 1. Eliminación nodal y mutación del signo en Σ2. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p12). Evidencia local en `e2e/artifacts/tutor-P1.2.png`.

### P1.3

Página 1. Eliminación nodal del paralelo y del retorno s. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p13). Evidencia local en `e2e/artifacts/tutor-P1.3.png`.

### P1.4

Página 1. Eliminación nodal y verificación de la reducción de la serie interna. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p14). Evidencia local en `e2e/artifacts/tutor-P1.4.png`.

### P1.5

Página 2. Eliminación nodal y mutación de la toma de Σ3. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p15). Evidencia local en `e2e/artifacts/tutor-P1.5.png`.

### P2.1

Página 3. Respuesta de polos simples y valor final. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p21). Evidencia local en `e2e/artifacts/tutor-P2.1.png`.

### P2.2

Página 3. Respuesta con polo repetido y forma equivalente factorizada. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p22). Evidencia local en `e2e/artifacts/tutor-P2.2.png`.

### P2.3

Página 3. Respuesta amortiguada, seno/coseno y error 15/13. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p23). Evidencia local en `e2e/artifacts/tutor-P2.3.png`.

### P2.4

Página 3. Respuesta a rampa y cancelación en el error. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p24). Evidencia local en `e2e/artifacts/tutor-P2.4.png`.

### P2.5

Página 3. Respuesta al escalón, errores separados y rechazo de 1,2. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p25). Evidencia local en `e2e/artifacts/tutor-P2.5.png`.

### P3.1

Página 4. Cruces, márgenes firmados y clasificación de estabilidad. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p31). Evidencia local en `e2e/artifacts/tutor-P3.1.png`.

### P3.2

Página 4. Cruces y márgenes negativos. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p32). Evidencia local en `e2e/artifacts/tutor-P3.2.png`.

### P3.3

Página 4. Dos cruces, sentidos, márgenes firmados y MG infinito. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p33). Evidencia local en `e2e/artifacts/tutor-P3.3.png`.

### P3.4

Página 4. Cruces separados y márgenes negativos. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p34). Evidencia local en `e2e/artifacts/tutor-P3.4.png`.

### P3.5

Página 5. Factor cuadrático en 1 rad/s, cruce y MG infinito. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p35). Evidencia local en `e2e/artifacts/tutor-P3.5.png`.

### P4.1

Página 6. Ganancia crítica 192 y frecuencia √23. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p41). Evidencia local en `e2e/artifacts/tutor-P4.1.png`.

### P4.2

Página 6. Multiplicidades, ausencia de ruptura interior y estabilidad. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p42). Evidencia local en `e2e/artifacts/tutor-P4.2.png`.

### P4.3

Página 6. Ruptura doble en −3 a K=9 y estabilidad para K>0. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p43). Evidencia local en `e2e/artifacts/tutor-P4.3.png`.

### P4.4

Página 6. Dos rupturas, ganancia crítica 10, auxiliar y frecuencia. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p44). Evidencia local en `e2e/artifacts/tutor-P4.4.png`.

### P4.5

Página 7. Centroide positivo, ruptura y frecuencia √8. [Ficha docente](PARCIAL_20_EJERCICIOS.md#p45). Evidencia local en `e2e/artifacts/tutor-P4.5.png`.

## Verificaciones transversales

| Alcance | Resultado observado |
|---|---|
| Índice y procedencia | 54 IDs. Cinco fichas del parcial por filtro con página y estado correctos. La sesión vacía se crea al empezar la primera ficha. |
| Ayuda y persistencia | P1.1 recuperó el borrador tras recargar y un doble envío avanzó una sola vez. Se reabrió un intento D1 guardado en el formato anterior, con su paso y borrador. |
| Modos | P1.1 completó Examen con 5/5, corrección al entregar y repetición con historial. En Inicial se probó la selección táctil de una toma. En Intermedio se recorrieron las 20 fichas. |
| Gráficos | Las curvas y marcas exactas se revelaron en su etapa. La API devolvió ramas para los cinco modelos de LGR. P4.4 abrió «Practicar solo Routh» con su tabla de cuarto orden y volvió al intento completo. |
| Pantalla y teclado | Chrome emuló selección táctil en Bode y LGR a 360 y 390 px. En bloques se probó toque a 360 px y teclado a 390 px. Los botones de inicio midieron al menos 44 px de alto. A 1440 px el diálogo recibió y devolvió el foco mediante Enter y Escape. Capturas adicionales en `e2e/artifacts/tutor-parcial-toma-360.png` y `e2e/artifacts/tutor-parcial-foco-1440.png`. |

## Integración

La evidencia corresponde al árbol de trabajo. Durante la implementación también cambiaron archivos compartidos del Tutor, entre ellos la ruta de LGR guiado y la simplificación gráfica de bloques. Queda pendiente aislar la entrega del parcial antes de integrar en `origin/main`.
