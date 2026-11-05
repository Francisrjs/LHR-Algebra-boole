# Interfaz de Routh y presentación matemática

Sección actualizada con frontend-design. La entrada utiliza etiquetas, borrador, vista previa y envío explícito. Los valores críticos y ejemplos siguen aplicándose directamente. La vista de Routh oculta los paneles del analizador independiente para no mezclar sus resultados.

Las ecuaciones, intervalos, valores de tabla y desarrollos se reciben como LaTeX desde SymPy y se renderizan con KaTeX (trust:false). Se corrigió la codificación dañada de los mensajes del motor. Las celdas y sus operandos comparten colores; los controles tienen foco visible y admiten teclado. En móvil la explicación aparece debajo de la tabla y las fórmulas extensas tienen desplazamiento local.

Verificado:
- 382 pruebas backend y 38 frontend aprobadas.
- Compilación TypeScript/Vite aprobada.
- 3432 expresiones LaTeX renderizadas sin errores en los 130 ejemplos: node e2e/routh-latex.cjs.
- Chrome, escritorio 1440×1000 y móvil 390×844: node e2e/routh.cjs. Sin desbordamiento horizontal de página ni errores JavaScript; edición de K, envío, biblioteca, selección con clic y Enter.
- Capturas: e2e/artifacts/routh.png y routh-mobile.png.

La modificación agrega presentación matemática al contrato de /api/routh; conserva los resultados aritméticos y las pruebas de los casos contrastados con MATLAB.
