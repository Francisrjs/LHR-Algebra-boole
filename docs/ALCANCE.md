# Estado del alcance

La entrega corresponde al MVP aprobado, con Bode prioritario. Los ejercicios del resumen se verifican en tests/test_core.py y tests/test_partial.py. La comparación independiente se reproduce con python -m tests.benchmark_comparison. La comparación directa con MATLAB/Simulink está preparada en validation/simulink y requiere ese software instalado; no se presenta como ejecutada.

Verificación completa local: verificar.cmd. Navegador: npm.cmd --prefix e2e test, con servidor iniciado.

No forman parte del MVP: editor arbitrario de diagramas, sistemas discretos/MIMO/no lineales, simulación hardware y módulos didácticos paso a paso.
