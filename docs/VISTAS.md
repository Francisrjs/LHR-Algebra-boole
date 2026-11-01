# Vistas y funcionalidades

## Controles compartidos

Elegir G/H separados o GH directo; editar expresiones o coeficientes descendentes, por ejemplo [1]/[1,3,2]. Agregar parámetros con nombre, valor, mínimo, máximo y paso. Modificar K mediante slider o campo numérico. La representación permite inspeccionar G₀, H, L_K y T_K cuando se conocen.

Las fracciones LaTeX debajo de las entradas muestran el último modelo calculado correctamente. Si una expresión está incompleta, revisar el error antes de interpretar la fórmula conservada como un resultado nuevo. Nuevo reinicia el proyecto; Abrir valida un JSON; Guardar descarga el estado; Restaurar guardado recupera la última copia de sesión. PNG/SVG exportan el gráfico activo, con ambas curvas en Bode.

## Bode

Subsistemas: parser → transferencia seleccionada → evaluación compleja → asintóticas/márgenes → Plotly/KaTeX.

Muestra magnitud en dB y fase desenrollada en grados sobre frecuencia logarítmica en rad/s. El cursor permite leer ambas magnitudes para una misma frecuencia. Activar asintóticas para comparar la aproximación por factores. El rango puede ser automático o manual; zoom/desplazamiento se conservan en el proyecto. Ajustar rango vuelve a incluir quiebres/cruces y elimina el zoom anterior.

Los márgenes siempre corresponden a L_K, incluso al visualizar otra transferencia. Se calculan sobre el modelo y no solamente el intervalo dibujado. Todos los cruces pueden consultarse; un cruce fuera de la vista no desaparece del cálculo. La estabilidad seleccionada y la característica se presentan por separado.

Prueba: G=1/(s+1), H=1, K=1. En ω=1, magnitud −3,0103 dB y fase −45°. Con K=10, la magnitud de L_K sube 20 dB y la fase se conserva. K=0 tiene magnitud −∞ y fase indefinida; null en las muestras no significa cero.

## Lugar de las raíces

Subsistemas: L₀ → root_locus_map y geometría → D₀+K N₀ → gráfico.

Dibuja ramas, polos abiertos, ceros, polos característicos para K, asíntotas, centroide, segmentos reales, rupturas válidas y cruces imaginarios. Cambiar K mueve los marcadores cerrados sin cambiar la transferencia base. Zoom, desplazamiento y exportación disponibles. Una transferencia impropia informa la incompatibilidad de LGR sin impedir Bode.

Prueba: G=1/(s(s+1)(s+3)), H=1. Centroide −4/3, ángulos 60°,180°,300°; con K=12 aparecen polos ±j√3 y estado marginal. K=11,88 estable; K=12,12 inestable.

## Polos y ceros

Subsistemas: modelo seleccionado → raíces → selección/edición → reconstrucción polinómica → nuevo análisis.

Seleccionar G₀ o H en modo separado, o L₀ en directo. Los modelos derivados no se editan libremente. Seleccionar una raíz para consultar/cambiar coordenadas; arrastrar conserva su conjugada y los coeficientes reales. Las raíces reales permanecen en el eje real. La ganancia líder se conserva.

Para una función parametrizada, usar Convertir a coeficientes para arrastrar. Deshacer recupera la expresión previa y sus parámetros; Restablecer vuelve al modelo de referencia de esa edición. Los polos característicos calculados al variar K siguen siendo resultados.

Prueba: 1/(s²+2s+2). Mover un polo complejo a −2+3j debe reconstruir denominador s²+4s+13.

## Respuesta temporal

Subsistemas: T_K → simulación temporal → métricas → curvas de entrada/salida.

Elegir escalón, rampa o impulso; ajustar duración y amplitud. El tiempo está en segundos. El muestreo se adapta a los polos; una duración excesiva informa que debe reducirse. Un componente Dirac del impulso se informa por su peso, no como un pico finito inventado. Las métricas de escalón aparecen únicamente cuando pueden calcularse para una transferencia estable; valores no aplicables se muestran sin cifra.

GH directo no habilita la C/R original: proporcionar G/H o aceptar explícitamente H=1. Una transferencia impropia o una simulación divergente informa el error dentro de este módulo.

Prueba del parcial: G=1/((s+1)(s+2)), H=1,K=1. T=1/(s²+3s+3); escalón con valor final 1/3. Revisar también los polos −1,5±j√3/2.

## Álgebra de bloques

Subsistemas: operandos etiquetados → parser → operación racional → equivalente/historial → analizador.

Admite 2 a 32 funciones; serie, paralelo, resta y realimentación negativa. Con más de dos operandos se aplica la operación acumulativamente de izquierda a derecha. La equivalente se puede enviar como nueva G del analizador, con H=1 y K=1. Operandos, operación e historial se conservan en el JSON. El editor interactivo permite resolver grafos e incluye los ejercicios 7 y 8 del libro y variantes numéricas propias.

Prueba: 1/(s+1) y 1/(s+2). Serie: 1/(s²+3s+2). Paralelo: (2s+3)/(s²+3s+2). Realimentación: (s+2)/(s²+3s+3).
