# Plan de ejecución · Integrar el parcial de 20 ejercicios al tutor

**Encargo para el agente ejecutor.** Incorporar los 20 ejercicios del [cuaderno docente](../PARCIAL_20_EJERCICIOS.md) al Tutor de Control Automático, dentro de sus cuatro temas. El estudiante debe poder encontrarlos como ejercitación pendiente, resolverlos paso a paso, pedir ayuda y retomar su intento. Entregar fichas documentadas, evidencia de QA contra las promesas de este plan y la implementación verificada en `origin/main`.

**Punto de partida.** La revisión remota `02aed944a167900e32df2f0e53405ad9e70c3623` contiene 33 fichas del manuscrito. La base de trabajo incluye además B6, un ejemplo por contribuciones. El parcial tiene 7 páginas y cinco ejercicios en cada tema. El PDF tiene SHA-256 `89595684797b26b5b678a8355f9be665e8ac4350520ff555e5829e8363a46385`. El catálogo de trabajo resultante reúne 54 fichas. Consultar [resultados y pendientes](../QA_TUTOR_PARCIAL_20.md).

| Tema visible en el tutor | IDs a incorporar | Páginas PDF | Total esperado en el tema, incluidos los originales |
|---|---|---|---:|
| Álgebra de bloques | P1.1–P1.5 | 1–2 | 20 |
| Laplace y error estacionario | P2.1–P2.5 | 3 | 11 |
| Bode directo | P3.1–P3.5 | 4–5 | 11 |
| Routh y LGR | P4.1–P4.5 | 6–7 | 12 |

## Los 20 ejercicios del parcial

El identificador enlaza la ficha docente individual. Las frecuencias están en rad/s. Los valores de Bode corresponden a la respuesta exacta.

| ID | Página | Práctica | Resultado de control |
|---|---:|---|---|
| [P1.1](../PARCIAL_20_EJERCICIOS.md#p11) | 1 | Lazo interno, serie y retorno exterior | 4/(s²+11s+38) |
| [P1.2](../PARCIAL_20_EJERCICIOS.md#p12) | 1 | Retorno positivo y ganancia negativa | −2(s+1)/(s²+4s+1) |
| [P1.3](../PARCIAL_20_EJERCICIOS.md#p13) | 1 | Paralelo y retorno derivativo | 5/(s²+8s+2) |
| [P1.4](../PARCIAL_20_EJERCICIOS.md#p14) | 1 | Serie dentro del lazo interno | 6(s+3)/(s³+6s²+14s+21) |
| [P1.5](../PARCIAL_20_EJERCICIOS.md#p15) | 2 | Dos cierres internos y retorno exterior | 6/(s²+6s+14) |
| [P2.1](../PARCIAL_20_EJERCICIOS.md#p21) | 3 | Escalón y polos simples | c=10−30 exp(−2t)+20 exp(−3t), error 0 |
| [P2.2](../PARCIAL_20_EJERCICIOS.md#p22) | 3 | Escalón y polo doble | c=4−(4+12t) exp(−3t), error 0 |
| [P2.3](../PARCIAL_20_EJERCICIOS.md#p23) | 3 | Escalón y polos complejos | c=(50/13)[1−exp(−2t)(cos(3t)+(2/3)sen(3t))], error 15/13 |
| [P2.4](../PARCIAL_20_EJERCICIOS.md#p24) | 3 | Rampa | c=2t−1+exp(−2t), error 1 |
| [P2.5](../PARCIAL_20_EJERCICIOS.md#p25) | 3 | Retorno no unitario | c=8[1−exp(−6t)], seguimiento −2 y comparador +2 |
| [P3.1](../PARCIAL_20_EJERCICIOS.md#p31) | 4 | Tres polos simples | MF +54,90° a 7,798 y MG +21,74 dB a 33,317. Estable. |
| [P3.2](../PARCIAL_20_EJERCICIOS.md#p32) | 4 | Integrador y dos polos | MF −19,34° a 9,480 y MG −13,56 dB a 4,472. Inestable. |
| [P3.3](../PARCIAL_20_EJERCICIOS.md#p33) | 4 | Dos cruces de magnitud | MF −21,88° a 0,32441 (ascendente) y +21,88° a 308,252 (descendente). MG infinito. Estable. |
| [P3.4](../PARCIAL_20_EJERCICIOS.md#p34) | 4 | Polos cercanos | MF −62,87° a 26,518 y MG −34,07 dB a 5,657. Inestable. |
| [P3.5](../PARCIAL_20_EJERCICIOS.md#p35) | 5 | Ceros complejos | MF +19,99° a 3083,373. MG infinito. Estable. A 1 rad/s el factor vale j. |
| [P4.1](../PARCIAL_20_EJERCICIOS.md#p41) | 6 | Cruce imaginario | Ruptura −1,8453 a K≈3,0792. 0<K<192, ωc=√23. |
| [P4.2](../PARCIAL_20_EJERCICIOS.md#p42) | 6 | Polo y cero dobles | Sin ruptura real interior. Todo K>0. |
| [P4.3](../PARCIAL_20_EJERCICIOS.md#p43) | 6 | Ruptura de segundo orden | Ruptura −3 a K=9. Todo K>0. |
| [P4.4](../PARCIAL_20_EJERCICIOS.md#p44) | 6 | Dos rupturas y tabla de orden cuatro | Rupturas −2,6180 y −0,3820 a K=1. 0<K<10, ωc=1. |
| [P4.5](../PARCIAL_20_EJERCICIOS.md#p45) | 7 | Centroide positivo | Centroide +0,5. Ruptura −0,45474 a K≈0,10807. 0<K<6, ωc=√8. |

## Fase 0 · Preparar la base

1. Leer el cuaderno, inspeccionar los diagramas originales y revisar [las referencias del tutor actual](../TUTOR_REFERENCIAS.md). Actualizar referencias remotas con `git fetch origin` e iniciar la rama de implementación desde `origin/main`. Si hay trabajo local de otra tarea, usar un worktree aparte. Registrar el SHA inicial y el resultado de `git status --short`.
2. Seguir [la preparación del proyecto](../PRUEBAS.md). Ejecutar la verificación base y el E2E del tutor antes de editar. Registrar los fallos previos con su comando y caso.
3. Revisar `frontend/src/tutor/{Tutor.tsx,exercise.ts,session.ts}`, los cuatro módulos de contenido y las aserciones de 33 en `tutor.test.ts` y `e2e/tutor.cjs`. En `Tutor.tsx` el índice y los renderizadores especializados buscan ejercicios en colecciones concretas. Integrar cada ficha en la colección que también alimenta su gráfico.

**Salida.** Base reproducible, cuatro grupos identificados y 20 IDs reservados. Mantener el historial del plan anterior referido a sus 33 originales.

## Fase 1 · Integrar el catálogo con una ficha vertical

1. Añadir procedencia y número original al modelo `Exercise`. Presentar «Práctica tipo parcial» dentro de cada tema, con número, título breve, página y estado. Usar P1.1 como primera ficha completa. En sesión nueva figura «Pendiente» y el botón «Empezar» abre la consigna. Crear intentos solo al comenzar.
2. Reutilizar `questions`, `numeric`, `expression`, `choose`, `AnswerField` y la sesión `controllab.tutor.v1`. Mantener los IDs y el orden de los pasos de las 33 fichas existentes. Resolver las rutas y el repaso por ID estable. Verificar con una sesión guardada anterior a la incorporación.
3. Implementar en P1.1 el ciclo que usarán las demás fichas. El alumno identifica la toma, reduce el lazo interno, multiplica la serie y cierra el retorno externo. Ante un signo incorrecto, conserva respuesta, dibujo y paso. La pista orienta hacia la entrada del sumador. Tras el acierto se explica el signo y se revela una sola reducción. «Resolver este paso» registra ayuda. En Examen, la devolución y la resolución se habilitan al entregar.
4. Aplicar UI UX Pro Max al flujo existente en React. En esta preparación se consultó la skill oficial `ui-ux-pro-max` en la revisión `2de1134d`, dominio `ux`, con las búsquedas `error feedback validation` y `keyboard chart accessibility`. Asociar el mensaje de error al campo, indicar cómo reintentar, mantener foco visible y ofrecer entrada por teclado para toda selección gráfica. Identificar trazos por etiquetas o símbolos además del color. [Guía de la skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/2de1134dc4d1cfe112934611ae5803ae17a1bd7e/.claude/skills/ui-ux-pro-max/SKILL.md)

**Salida.** P1.1 pasa de pendiente a en curso y completado. Una recarga restaura el paso y el borrador. Una sesión histórica reabre su ficha original. Conservar una captura y un caso E2E de este recorrido antes de replicarlo.

## Fase 2 · Completar bloques y Laplace

- **Bloques, P1.2–P1.5.** Completar `blocks.ts` y los gráficos de `PracticeGraphics.tsx` a partir de las conexiones del PDF. Verificar cada equivalente mediante ecuaciones nodales independientes del constructor. Como control negativo, invertir el retorno positivo de P1.2 y cambiar una toma en P1.5. El test debe detectar ambos cambios.
- **Laplace, P2.1–P2.5.** Añadir las fichas en `laplace.ts`. En cada una pedir entrada, salida en s, transformación intermedia, c(t) y error. Incluir potencia repetida, seno/coseno, rampa y medición no unitaria según el cuaderno. Comprobar formas equivalentes y entradas con coma decimal. P2.5 exige dos pasos con rótulos distintos y la fe de erratas en la revisión docente.
- **Documentación.** Completar las diez fichas del cuaderno con los identificadores de sus pasos y pruebas, el criterio de corrección, una pista que oriente el procedimiento y el error típico que detecta. Colocar la explicación completa tras resolver o en el solucionario docente.

**Salida.** Diez fichas nuevas accesibles desde sus dos temas. Las cinco transferencias y cinco respuestas temporales coinciden con referencias obtenidas por ecuaciones o transformada. QA rechaza 1,2 como error del comparador en P2.5.

## Fase 3 · Bode directo

- Incorporar P3.1–P3.5 en la colección consumida por `bode.ts` y `BodeGraph.tsx`. El modelo actual representa los factores como pares de frecuencia y multiplicidad. Examinar `bodeManual.ts` y el soporte cuadrático del laboratorio antes de extender el tutor para el numerador s²+s+1 de P3.5. Evaluar su respuesta compleja y su fase con ωn y ζ.
- Para cada ficha, separar construcción por rectas y lectura exacta. Registrar cruces con frecuencia, eje y sentido. Mostrar la contribución o marca recién confirmada. Añadir alternativa mediante campo numérico a cada selección en el gráfico. Cubrir la extensión del eje hasta el último cruce.
- Comprobar los márgenes contra la evaluación compleja independiente y la estabilidad contra D+N. Documentar y probar **los dos cruces de P3.3**. Representar MG infinito como respuesta conceptual con ausencia de marcador finito. Fijar tolerancias por tipo de respuesta: como punto inicial, usar las del [tutor Bode](../TUTOR_REFERENCIAS.md) para lectura por rectas y lectura exacta. Para respuestas calculadas y gráficos de pantalla, probar un valor aceptado y otro fuera de tolerancia.

**Salida.** Cinco recorridos nuevos con magnitud, fase, márgenes e interpretación. En P3.5, comprobar el factor cuadrático también en ω=1, donde su valor complejo es j y su aporte exacto es 0 dB y +90°.

## Fase 4 · Lugar de las raíces y Routh

- Integrar P4.1–P4.5 en `locus.ts`. Hoy el modelo tipa exactamente tres polos, un cero opcional y una ruptura. Habilitar orden variable, multiplicidad, cero o varios puntos de ruptura y cruce imaginario opcional. Reutilizar `/api/analyze` para las ramas y revisar la tabla de `PracticeGraphics.tsx` con polinomios de órdenes 2, 3 y 4.
- Derivar las etapas de identificación, segmentos, asíntotas, ruptura y tabla a partir de cada modelo. En P4.2 aceptar ausencia de ruptura interior y mostrar polos y ceros dobles con su multiplicidad. En P4.4 pedir las dos rupturas en el orden explicitado o aceptar su permutación y completar la fila auxiliar en K=10. Ofrecer «Practicar solo Routh» con sus propias etapas, como en el tutor existente.
- Verificar cada rango simbólicamente. Para los tres casos con K crítico finito, contrastar raíces debajo, en y encima del límite. Para los otros dos, justificar todo K>0 con la tabla y probar valores representativos. Documentar tolerancias distintas para posición s, ganancia K y frecuencia ωc.

**Salida.** Cinco fichas nuevas con ramas y tablas progresivas. P4.3 llega a la raíz doble −3, P4.4 marca dos rupturas para la misma ganancia y P4.5 conserva el signo positivo del centroide.

## Fase 5 · Auditar lo prometido

Crear `docs/QA_TUTOR_PARCIAL_20.md` al implementar. Usar una fila por ID con tema, página, test matemático, recorrido de navegador, resultado observado y referencia a evidencia. Añadir las filas transversales siguientes. En cada corrida registrar fecha, revisión de código, entorno, comando, resultado y artefacto. Si un caso falla, anotar el paso, corregirlo y volver a ejecutar el caso y sus regresiones. Identificar como pendiente cualquier comprobación sin evidencia.

| Promesa | Prueba que debe ejecutar QA | Criterio de aceptación |
|---|---|---|
| Cobertura y procedencia | Comparar un listado esperado independiente con el catálogo y el índice visible. Filtrar cada tema desde una sesión vacía. | 33 originales, B6 y 20 del parcial, 54 IDs únicos. En cada filtro aparecen cinco del parcial con página correcta, «Pendiente» y acción de inicio. |
| Resolución didáctica | Recorrer cada uno de los 20 IDs desde el índice hasta el resultado. Usar respuestas de referencia independientes de los objetos de la UI. En cada familia probar un error, pista y reintento. | Cada consigna permite deducir el siguiente paso. Error conserva paso y borrador. Acierto avanza una vez y explica. Pedir solución queda registrado. |
| Matemática y gráficos | Cotejar cada ID con el cuaderno. Probar signos, unidades, equivalencias y un distractor por ficha. Leer ejes, ramas y marcadores en la UI. | Se cumplen los hitos de las fases 2–4, incluidas las correcciones de P2.5 y P3.3. No se dibujan resultados futuros. |
| Modos y sesión | Cubrir Inicial, Intermedio y Examen. Recargar un intento con borrador, repetir una ficha y reabrir una sesión de los 33 originales. Probar doble envío. | Se recupera el mismo paso. Repetir conserva historial. Examen corrige al entregar. El doble envío avanza una sola vez. |
| Uso en móvil y con teclado | A 360 y 390 px completar una interacción gráfica de cada familia que la use. A 1440 px recorrer índice, formulario y gráfico ampliado con teclado. Revisar nombre, foco, feedback y retorno de foco. | Sin desborde horizontal de la página. Controles táctiles principales ≥44×44 px. Las lecturas y respuestas son posibles sin puntero. Adjuntar capturas y distinguir emulación de equipo físico. |
| Regresión y documentación | Mantener la aserción de identidad de los 33 originales en `tutor.test.ts`. Actualizar la cuenta global en `e2e/tutor.cjs` y registrar los nuevos recorridos en el comando E2E si se crea otra suite. Seguir todos los enlaces desde el índice de documentación. | Pasan pruebas Python, frontend, build y navegador. Las 20 filas del informe enlazan fichas y evidencias. Cada promesa tiene un resultado observado. |

**Comandos de cierre**, desde la raíz en PowerShell:

```powershell
.\verificar.cmd
.\iniciar.cmd --no-browser
```

Mantener el servidor en esa consola. En otra, ejecutar:

```powershell
npm.cmd --prefix e2e test
git diff --check
```

Si faltan dependencias de navegador, seguir [PRUEBAS.md](../PRUEBAS.md). Actualizar el [índice de documentación](../README.md), la guía de vistas y el informe con los comandos reales, conteos y limitaciones. Adjuntar evidencia de navegador a la entrega usando una ubicación consultable por el revisor.

## Fase 6 · Integrar a main y entregar

1. Revisar el diff contra `origin/main` y preparar commits por contenido, interacción y QA. Agregar al índice únicamente los archivos de esta tarea. Mantener fuera archivos temporales, datos de sesión y cambios locales ajenos.
2. Actualizar la rama con el último `origin/main`. Si la integración modifica código o pruebas, repetir la fase 5 sobre esa revisión. Subir la rama y completar el merge a `main` por el mecanismo del repositorio. Si hay protección o revisión obligatoria, indicar el PR y su estado hasta completar la integración.
3. Ejecutar `git fetch origin main`, registrar el SHA de `origin/main` y comprobar allí el catálogo, cuaderno e informe de QA. En caso de squash, verificar el contenido en el commit integrado. Entregar el enlace a esa revisión y al informe. Un push de la rama de trabajo por sí solo deja esta fase pendiente.

**Seguimiento.** El [informe de QA](../QA_TUTOR_PARCIAL_20.md) reúne las verificaciones, la evidencia y los pendientes de integración.
