# Decisiones de implementación

Fecha: 2026-10-31

El plan aprobado en el chat es la especificación vinculante. Bode es inicial y prioritario; cálculos exclusivamente Python. React/TypeScript/Plotly representa resultados de FastAPI local. Sin servicios externos durante uso.

Se implementan además LGR, plano editable, temporal, álgebra, persistencia JSON y exportación PNG/SVG. No resolución paso a paso. K independiente aplicado una vez. GH no determina C/R sin supuesto explícito. CA-04 corregido: T=2(s+2)/(s²+3s+8).

Responsabilidades: backend y pruebas numéricas; frontend y controles; lanzador y validación integrada. No hay checkout git previo, se reutiliza la carpeta suministrada sin crear worktree.

Precisión: casos analíticos y evaluación independiente; no se considera suficiente que una gráfica parezca correcta. Objetivo de interacción menor a 300ms hasta orden 6, medido en equipo local. Motor desacoplado para alternativa Qt si integración web no cumple tras optimizar.
