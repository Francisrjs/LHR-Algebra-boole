# Documentación de ControlLab

Aplicación local para explorar sistemas de control continuos LTI SISO. El navegador muestra las curvas; Python calcula. No hay base de datos ni servicios remotos durante el uso. Los proyectos se descargan como JSON.

## Recorrido recomendado

1. [Instalación y pruebas](PRUEBAS.md): iniciar, desarrollar y verificar.
2. [Arquitectura y subsistemas](ARQUITECTURA.md): flujo de datos y responsabilidades.
3. [Guía de vistas](VISTAS.md): controles, resultados y ejemplos de uso.
4. [API HTTP](API.md): métodos, entradas, respuestas y errores.
5. [Validaciones](VALIDACIONES.md): reglas de entrada, matemáticas y persistencia.
6. [Evidencia de verificación](VERIFICACION.md): resultados observados y límites de las mediciones.

El contrato de solicitudes exacto está exportado en [openapi.json](openapi.json). Los [ejemplos JSON](ejemplos/) fueron ejecutados contra la aplicación con TestClient y devolvieron HTTP 200. Las respuestas del análisis contienen cientos de muestras; su estructura se explica en API.md.

Los documentos ALCANCE.md e IMPLEMENTACION.md conservan contexto de la entrega. La comparación directa con MATLAB/Simulink está en ../validation/simulink; requiere ese software y no debe confundirse con las verificaciones independientes ya ejecutadas.
