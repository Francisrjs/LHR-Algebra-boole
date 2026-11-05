# Validación de Routh con MATLAB MCP

Fecha: 2026-11-01. MATLAB R2026b Update 1 y Symbolic Math Toolbox.

## Resultado

**PASS: 130 casos matemáticos, 0 discrepancias.** Cada grupo tiene 10 variantes cargadas en el selector de la pestaña Estabilidad · Routh.

| Grupo | Casos |
|---|---:|
| Estabilidad con raíces repetidas izquierdas | 10 |
| Polos derechos | 10 |
| Frontera con imaginarios simples | 10 |
| Imaginarios repetidos | 10 |
| Repetición izquierda y eje simple (regresión del fallo) | 10 |
| Pivote cero y epsilon | 10 |
| Filas nulas y raíces simétricas | 10 |
| Origen simple con raíces izquierdas repetidas | 10 |
| Coeficiente principal negativo | 10 |
| Familia cúbica con K | 10 |
| Origen repetido | 10 |
| Constantes sin polos | 10 |
| Cambio de grado en K crítico | 10 |

MATLAB construyó independientemente las tablas con símbolos exactos, derivadas auxiliares y epsilon positivo. Comparó todas las celdas mediante simplificación de diferencias a cero. Clasificó las raíces simbólicas sin restringir s a real y comprobó la multiplicidad de raíces sobre el eje imaginario con el máximo común divisor. Para los 10 valores de la familia cúbica confirmó el intervalo 0<K<6. Los casos de cambio de grado se contrastaron en el valor crítico; sus intervalos completos no se contrastaron simbólicamente con MATLAB en esta batería.

## Corrección

La clasificación ya no combina cualquier raíz repetida con cualquier raíz imaginaria. Cuenta exactamente las raíces del MCD de las partes real e imaginaria de P(iw), y repite la comprobación sobre MCD(P,P'). Así (s+1)^2(s²+1) es frontera y (s²+1)^2 es inestable. Se eliminó la dependencia de nroots y de umbrales numéricos para esta clasificación. Los signos en epsilon se obtienen del término dominante exacto. Se evalúan por separado los puntos donde se anula el coeficiente principal para incluir grados reducidos estables en los intervalos.

## Otras verificaciones

- 381 pruebas backend aprobadas: incluye 130 casos directos, los mismos 130 por API y 10 rechazos de entradas inválidas.
- 35 pruebas frontend aprobadas y compilación TypeScript/Vite correcta.
- Chrome/Playwright sobre http://127.0.0.1:8765: 13 grupos y 130 opciones; selección de celda, operandos, fórmula y cambios de clasificación en frontera, repetición y epsilon. Sin errores JavaScript.
- La instancia 8765 fue reiniciada y el caso original responde HTTP 200 con boundary.
- No se modificaron las referencias MATLAB congeladas existentes.

## Reproducción y evidencia

- Catálogo: frontend/src/routhExamples.json.
- Datos contrastados: validation/routh/inputs.json.
- Comparador independiente: validation/routh/compare_matlab.m, ejecutado mediante MCP evaluate_matlab_code con run.
- Resultado por caso: validation/routh/matlab_results.json.
- Pruebas: tests/test_routh.py; navegador: node e2e/routh.cjs.
- Captura: e2e/artifacts/routh.png.

Las 10 entradas inválidas son pruebas de contrato API, no comparaciones matemáticas MATLAB. Esta batería cubre los grupos enumerados; no demuestra corrección para todo polinomio arbitrario de grado hasta 20.
