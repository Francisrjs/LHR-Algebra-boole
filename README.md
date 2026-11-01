# LHR-Algebra-boole — ControlLab

Laboratorio local de sistemas continuos LTI SISO. Bode es la vista inicial; comparte el modelo con LGR, polos y ceros, respuesta temporal y álgebra de bloques. El navegador dibuja resultados calculados por Python.

## Documentación

La guía completa está en [docs/README.md](docs/README.md): arquitectura, vistas, API HTTP, validaciones y pruebas reproducibles.

## Ejecutar en Windows

1. Instalar Python 3.11 o superior y Node.js LTS. Ambos deben estar disponibles en PATH.
2. Abrir `setup.cmd` una vez con conexión. Instala el entorno Python y compila los recursos del navegador.
3. Abrir `iniciar.cmd`. La aplicación abre `http://127.0.0.1:8765`.

Después de la preparación funciona sin conexión y no necesita Node para ejecutarse. Los proyectos se guardan como archivos JSON y los gráficos se exportan desde la interfaz. No hay cuentas, base de datos ni servicios externos.

Para detenerla, presionar **Ctrl+C** en la ventana del lanzador. Si el puerto está ocupado, ejecutar `iniciar.cmd --port 8766`. Para iniciar sin abrir una pestaña: `iniciar.cmd --no-browser`.

## Modelo

La ganancia de barrido K se aplica una sola vez: `L_K=K G₀ H` y `T_K=K G₀/(1+K G₀ H)`. En modo GH directo, conocer L no determina la transferencia original C/R; se requiere G/H o un supuesto explícito de realimentación unitaria.

Las expresiones admitidas son racionales con coeficientes reales. Los parámetros se modifican con sus controles. K se controla por separado. Los modelos no se simplifican cancelando polos y ceros silenciosamente. Una expresión incompleta conserva el último resultado válido.

Las curvas asintóticas son aproximaciones visuales; los márgenes se obtienen del modelo matemático, independientemente del rango visible. La estabilidad se consulta por los polos y no únicamente por los márgenes. Una transferencia impropia puede admitir análisis de frecuencia aunque no una simulación temporal ordinaria.

## Desarrollo y verificación

```powershell
.\.venv\Scripts\python.exe -m pytest
npm.cmd --prefix frontend run build
.\.venv\Scripts\python.exe launch.py --no-browser
```

El núcleo vive en `backend/`; la interfaz en `frontend/`. La API se sirve únicamente en loopback. Las dependencias JavaScript se empaquetan localmente y las fuentes usan recursos del sistema.

Para las pruebas de navegador, con Chrome instalado y el servidor abierto:

```powershell
npm.cmd --prefix e2e install
npm.cmd --prefix e2e test
```

Las suites bloquean solicitudes externas, comprueban navegación, edición gráfica, conversión de modo, álgebra, persistencia de zoom y funciones, restauración del último guardado, las tres señales temporales y exportaciones. Guardan capturas en `e2e/artifacts/` y miden desde el evento de edición de K hasta la actualización del gráfico, incluyendo los 150 ms de agrupación de cambios. El detalle de la verificación realizada figura en `docs/VERIFICACION.md`.

El PRD original se conserva como referencia. Bode se incorpora al MVP y CA-04 se corrige: para G=2/(s+1), H=3/(s+2), K=1, corresponde T=2(s+2)/(s²+3s+8).
