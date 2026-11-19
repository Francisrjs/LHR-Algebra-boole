# Handoff de sesión

El [plan del parcial](plan/PLAN_TUTOR_PARCIAL_20.md#los-20-ejercicios-del-parcial) reúne las fichas P1.1 a P4.5. Los comandos y resultados se registran en su [informe de QA](QA_TUTOR_PARCIAL_20.md).

## TUTOR-UI-001

El [registro de la feature](FEATURE_LIST.md) vincula la experiencia de práctica con la [bitácora del Tutor](../carpeta-compa/PLAN_TUTOR_CONTROL_AUTOMATICO.md#12-bitácora-para-continuar-la-ejecución).

- `AnswerField.tsx` comparte selección, entrada numérica, edición de expresiones y feedback entre práctica y repaso. El borrador sigue guardándose como texto en `controllab.tutor.v1`.
- `GraphicPanel.tsx` pone el visual activo en un diálogo nativo. El intento conserva el eje, el esquema y el punto seleccionado. La solución del examen se habilita después de entregar.
- Se ejecutaron las consultas de sistema de diseño, UX y React de [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/2de1134). Se aplicaron controles táctiles amplios, espaciado, foco visible y errores vinculados al campo. Se conservó la paleta oscura del laboratorio, adecuada al contexto técnico y a sus gráficos existentes.
- Verificación completada el 19 de noviembre de 2026. Pasaron 394 pruebas Python, 52 de frontend, la compilación y las suites Playwright de smoke, aceptación y Tutor. Se revisaron capturas a 360, 390, 768 y 1440 px.
- La verificación en un teléfono físico queda pendiente. En Windows, iniciar con `iniciar.cmd --lan`, abrir `/#tutor` en el teléfono y comprobar el teclado, el gráfico ampliado y la recuperación del intento.

## Tutor de Bode y notación matemática

- La leyenda identifica polos con × y ceros con ○. Los factores en el origen se identifican fuera de la escala logarítmica. Confirmar el quiebre coloca el símbolo, confirmar la pendiente dibuja la recta y confirmar el nivel agrega el punto individual.
- Los encabezados, expresiones intercaladas y borradores usan KaTeX. La vista previa informa errores de sintaxis mientras se escribe.
- Pasaron 53 pruebas de frontend, la compilación de producción y el recorrido Playwright del tutor. B1 comprueba el polo de origen, −20 dB/década, 40 dB a 0,01 rad/s y ambos quiebres por toque y por teclado. B2 tiene cobertura unitaria del cero simple y el polo doble. Se revisaron capturas de Laplace a 390 y 1440 px.

## B6 · Aportes y suma por rectas

Al confirmar la identidad de un factor, el tutor dibuja su recta en ambos ejes. El símbolo sobre la curva del integrador marca su aporte a 1 rad/s. Los factores finitos llevan el símbolo en su quiebre. La suma roja se superpone a los aportes desde el primer punto total confirmado. En magnitud se extiende al confirmar el nivel final de cada intervalo y en fase al confirmar cada ángulo total.

El ejemplo B6 incluye el polo real y el par de ceros complejos con quiebre común en 1 rad/s. Las 54 pruebas de frontend, el build y Playwright del tutor pasaron. Se verificaron los siete puntos guía de magnitud y fase, y se guardaron capturas en e2e/artifacts/b6-*.png.

## Simplificación gráfica de bloques

Los intentos nuevos D1–D15 usan la ruta «reduccion». Cada operación confirmada habilita su dibujo en el selector Esquema. La tabla 4-3 de docs/pdf se puede consultar dentro del tutor. D12 sigue la resolución gráfica de la página 12 del final. En D15 la toma de H1 se compensa antes de combinar las ramas.

Se contrastaron numéricamente todos los esquemas intermedios con sus originales. Pasaron las 54 pruebas de frontend, la compilación y Playwright, incluidos D12 con recarga del intento y D15 con corrección de una respuesta errónea.

## LGR guiado y Routh

En Inicial e Intermedio los intentos nuevos de L1–L6 y P4.1–P4.5 separan el despeje de K, las derivadas de D y N, el candidato de ruptura y la evaluación de −D/N. Luego usan la ecuación característica para construir Routh y, cuando existe, hallar la ganancia crítica. Los intentos anteriores conservan sus pasos y ofrecen el botón «Practicar K con guía». El examen conserva su recorrido.

Se verificaron las opciones de la práctica guiada, los índices de celdas y los cruces del gráfico en las 11 variantes. Chrome comprobó en L5 la selección de la ganancia de ruptura, la reanudación del ejercicio y el cálculo de la ganancia crítica.
