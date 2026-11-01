# Instalación, desarrollo y pruebas

Todos los comandos se ejecutan desde la raíz del proyecto en PowerShell.

## Preparación y ejecución

Requisitos: Windows, Python3.11+ y Node.js compatible con las dependencias fijadas en package-lock.json durante instalación/desarrollo. El entorno verificado utilizó Node22. Chrome es necesario para e2e.

```powershell
.\setup.cmd
.\iniciar.cmd
```

setup crea .venv, instala requirements.txt y compila frontend con dependencias locales. Necesita conexión la primera vez. iniciar ejecuta Python y abre el navegador cuando /api/health responde. Después del setup, el uso normal no requiere Node ni conexión.

```powershell
.\iniciar.cmd --port 8766
.\iniciar.cmd --no-browser
```

Cerrar con Ctrl+C en la consola. Puerto ocupado: cerrar la otra instancia o elegir otro. Falta frontend/dist: ejecutar setup o compilar. Python debe permanecer activo para recalcular.

## Desarrollo

En una consola:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --reload
```

En otra:

```powershell
npm.cmd --prefix frontend run dev
```

Abrir la URL que indique Vite. Su proxy /api apunta al puerto8765; si se cambia el backend, ajustar frontend/vite.config.ts. La ejecución de producción usa dist, por lo que cambios de frontend requieren recompilar:

```powershell
npm.cmd --prefix frontend run build
```

## Pruebas automáticas

| Comando | Comprueba |
|---|---|
| .\.venv\Scripts\python.exe -m pytest -q | Parser, contratos API, casos analíticos, márgenes, singularidades, raíces, persistencia y parcial |
| npm.cmd --prefix frontend test | Validación de proyectos, estado y conversión de polinomios a LaTeX |
| npm.cmd --prefix frontend run build | TypeScript y empaquetado de recursos offline |
| .\verificar.cmd | Las tres verificaciones anteriores; corta ante fallo |

Para navegador, iniciar primero la aplicación:

```powershell
npm.cmd --prefix e2e install
npm.cmd --prefix e2e test
npm.cmd --prefix e2e run performance
```

smoke.cjs verifica arrastre real/Deshacer, GH sin dobleK, navegación, JSON idéntico y PNG/SVG. acceptance.cjs comprueba álgebra/historial/rangos persistidos, último guardado, entrada inválida, tres señales, GH explícito y órdenes6/8. Bloquean recursos externos y reportan errores JavaScript. performance.cjs mide30 cambios de K en orden6 desde evento de edición hasta Plotly, incluido debounce. Artefactos: e2e/artifacts/. Un resultado de rendimiento depende de equipo/modelo, no garantiza todos los casos.

La base por defecto es http://127.0.0.1:8765; las suites permiten CONTROLLAB_URL. Si Playwright no encuentra navegador, instalar Chrome o configurar CHROME_PATH; PLAYWRIGHT_MODULE permite indicar el módulo disponible en otro runtime.

## Verificación manual contra el parcial

1. Escalón: G=1/((s+1)(s+2)), H=1,K=1. T=1/(s²+3s+3), polos −1,5±j√3/2 y valor final1/3. test_step_analytic compara toda la curva con error absoluto<1e-4.
2. LGR3A: G=1/[s(s+1)(s+3)]. K12 marginal, ±j√3, centroide−4/3 y ruptura−0,451416. Probar a ambos lados de12.
3. LGR3B: G=(s+2)/[s(s+1)(s+3)], centroide−1, asíntotas90°/270°. Las pruebas ensayan varias ganancias positivas; no confundir muestreo de ganancias con demostración simbólica general.
4. H no unitaria: G=2/(s+1),H=3/(s+2). T=2(s+2)/(s²+3s+8), valor final0,5. No sustituirla por L/(1+L).
5. Bode: G=1/(s+1),H=1; en ω1:−3,0103dB/−45°. K×10 suma20dB a L sin cambiar fase.

Otros ejercicios del resumen verifican Kcrítico6 con ω√2 y Kcrítico30 con ω√6. Ver tests/test_partial.py.

## Comparación independiente y Simulink

La batería MATLAB/API/web, el proceso para renovar las referencias y los criterios numéricos están documentados en [`validation/matlab/README.md`](../validation/matlab/README.md). Su ejecución produce un cuadro comparativo por verificación y continúa tras cada falla individual.

```powershell
.\.venv\Scripts\python.exe -m tests.benchmark_comparison
```

Genera e2e/artifacts/comparacion-numerica.png y JSON con error frente a solve_ivp. No ejecuta Simulink. Para comparación directa seguir validation/simulink/README.md y ejecutar compare_simulink.m en MATLAB con Simulink. El estado de esa prueba debe comprobarse por separado de las pruebas Python.

## Lectura de resultados

Exit code0 y suites sin fallos indican aprobación de los casos ejecutados. No usar solamente una captura como evidencia de precisión. La deprecación de Starlette/HTTPX observada en TestClient es una advertencia de dependencias; si aparecen fallos reales no deben ignorarse. docs/VERIFICACION.md registra las mediciones históricas, no sustituye una nueva ejecución.
