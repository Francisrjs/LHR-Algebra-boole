# Validación de ControlLab contra MATLAB

Esta batería contrasta los endpoints documentados y la aplicación web con referencias numéricas calculadas por MATLAB Control System Toolbox. Cada caso conserva su propio resultado: una excepción o discrepancia queda registrada y la ejecución continúa con el siguiente caso. El estado global solo es **APROBADO** cuando todas las filas pasan.

## Requisitos

- API de ControlLab iniciada, por defecto en `http://127.0.0.1:8765`.
- Entorno Python del proyecto (`.venv`) con sus dependencias.
- Playwright y Chrome para las comprobaciones web. Instalar la dependencia de desarrollo en `e2e/` cuando sea necesario.
- Para renovar referencias: MATLAB, Control System Toolbox y el MCP de MATLAB conectado a esta sesión.

## Ejecutar la batería

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:CONTROLLAB_URL = "http://127.0.0.1:8765"
.\.venv\Scripts\python.exe validation\run_api_validation.py
```

La ejecución completa consulta `/api/health`, `/api/analyze`, `/api/algebra`, `/api/edit-roots` y `/api/validate-project`; luego ejecuta Playwright para comparar gráficas y resultados, probar cambios de K y G/H, errores de entrada, proyectos, arrastre y exportaciones.

Para aislar la comparación API/MATLAB y los contratos HTTP:

```powershell
.\.venv\Scripts\python.exe validation\run_api_validation.py --skip-web
```

También se puede indicar la URL sin variable de entorno con `--base-url`. Los códigos de salida son `0` si todas las filas pasan, `1` si la batería terminó con una o más fallas y `2` si no pudo iniciarse (por ejemplo, referencias incompatibles o API inaccesible al inicio).

## Catálogo y referencias

`cases.json` define los modelos C01–C12, parámetros, variantes de K, representaciones, entradas temporales y el caso de márgenes múltiples. Los coeficientes numéricos permiten que el generador de MATLAB construya `tf` sin evaluar expresiones de usuario.

`references.json` contiene transferencias, polos y ceros, estabilidad, márgenes, geometría del LGR, Bode y respuestas temporales; también conserva versión/release de MATLAB y la lista de toolboxes. Estas referencias congeladas permiten repetir la batería sin abrir MATLAB.

Para **renovar explícitamente** la referencia, ejecutar con MATLAB MCP el archivo `generate_reference.m`. El script sobrescribe `references.json` y deja en su metadato la versión de MATLAB usada. Revisar el cambio de referencias antes de aceptarlo. No ejecutar esta renovación automáticamente desde la batería normal.

## Criterios numéricos

| Magnitud | Tolerancia inicial |
|---|---:|
| Polos, ceros, centroide y ruptura | `1e-6` absoluto |
| Bode | `0,1 dB` y `0,5°` |
| Frecuencias de cruce | `0,5 %` relativo |
| Ganancias críticas | `0,1 %` relativo |
| Respuestas temporales | `1e-3` absoluto |
| Geometría algebraica | `1e-6` relativa en puntos complejos de prueba |

La fase usa distancia mínima módulo 360°. Los márgenes se comparan por separado como finitos, infinitos o indefinidos, además de comprobar todos los cruces en el caso de márgenes múltiples. El navegador compara los datos trazados con los arrays de la API; una semejanza visual no cuenta como verificación numérica.

## Reporte

Cada ejecución escribe `results/latest.md` y `results/latest.json` con estado, valores esperados de MATLAB, valores observados, error, tolerancia y detalle. `results/` es salida temporal e ignorada por Git; el catálogo y las referencias congeladas permanecen como fixtures de validación.

Simulink queda en una fase aparte. La batería inicial no lo necesita; ver [`../simulink/README.md`](../simulink/README.md) para la comparación temporal independiente.
