# Comparación directa con Simulink

Requiere MATLAB y Simulink instalados y con licencia. No necesita Control System Toolbox.
En MATLAB ejecutar:

    run('C:/Users/franr/OneDrive/Documentos/Progamacion/tecnologia-practico/validation/simulink/compare_simulink.m')

El script construye cuatro modelos SLX de realimentación negativa con G/H y K, ejecuta ode45 con RelTol 1e-10 y AbsTol 1e-12, contrasta 1001 puntos en 20 segundos y produce results/comparacion-simulink.png y .json. Los datos de ControlLab están en fixtures.json.

La prueba temporal compara dos motores distintos. La comprobación Bode del script usa evaluación polinómica de MATLAB, no un bloque estimador de frecuencia Simulink. Los tiempos Simulink incluyen sim() y transferencia de resultados; no equivalen al tiempo de actualización de una interfaz ni permiten afirmar que un producto entero es más rápido. Cinco repeticiones calientes excluyen la primera compilación.

Estado: fase separada y pendiente de ejecución. MATLAB está disponible mediante MATLAB MCP en el entorno de desarrollo; esta comprobación no se ejecutó como parte de la batería inicial API/web. Ejecutar manualmente `compare_simulink.m` cuando se quiera validar esa comparación temporal independiente.
