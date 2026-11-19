# Cuaderno docente del parcial de 20 ejercicios

Las fichas P1.1 a P4.5 se encuentran en «Práctica tipo parcial» dentro del tema correspondiente. La parte numérica reproduce la numeración de la guía y las páginas se cuentan desde 1. El alumno empieza con el enunciado y los datos de entrada. [PDF original, siete páginas](libro/Parcial_Practica_20_Ejercicios_Con_Graficos.pdf) · [Plan con los 20 ejercicios](plan/PLAN_TUTOR_PARCIAL_20.md#los-20-ejercicios-del-parcial)

## Álgebra de bloques

Consigna común: hallar T=C/R. Mostrar el diagrama completo con signos, tomas, ramas y flechas. Pedir que el alumno seleccione qué reducir, escriba el equivalente local y reconstruya el lazo exterior. La pista debe señalar qué señal vuelve al sumador. Tras la confirmación, superponer el equivalente y explicar por qué conserva las señales de entrada y salida.

| ID | Pág. | Recorrido de resolución | T(s) de referencia |
|---|---:|---|---|
| P1.1 | 1 | Cerrar 4/(s+2) con retorno unitario negativo → 4/(s+6). Ponerlo en serie con 1/(s+5). Cerrar con H₂=2. | 4/(s²+11s+38) |
| P1.2 | 1 | En el lazo positivo de 1/(s+4) obtener 1/(s+3). Incorporar la ganancia −2. Cerrar el retorno negativo con H₂=1/(s+1) y conservar el signo del numerador. | −2(s+1)/(s²+4s+1) |
| P1.3 | 1 | Sumar 2/(s+1) y 3/(s+1) en paralelo. Multiplicar por 1/(s+2). Realimentar negativamente con H=s. | 5/(s²+8s+2) |
| P1.4 | 1 | Cerrar la serie 1/[(s+1)(s+2)] con H₁=3 → 1/(s²+3s+5). Anteponer 6. Cerrar con H₂=1/(s+3). | 6(s+3)/(s³+6s²+14s+21) |
| P1.5 | 2 | Identificar los tres retornos negativos unitarios. Reducir por separado 2/s y 3/(s+1) → 2/(s+2) y 3/(s+4). Multiplicar y cerrar el retorno exterior. | 6/(s²+6s+14) |

## Laplace y error estacionario

Adoptar condiciones iniciales nulas y t≥0. Pedir R(s), C(s)=T(s)R(s), descomposición, inversa y límite del error. En P2.1–P2.4 el enunciado entrega T cerrada. En P2.5 entrega G y H. Identificar los polos de sE(s) antes de usar el teorema del valor final.

| ID | Pág. | Datos y paso distintivo | c(t) y error de seguimiento R−C |
|---|---:|---|---|
| P2.1 | 3 | T=6/[(s+2)(s+3)], H=1, escalón 10. Descomponer 60/[s(s+2)(s+3)] con residuos 10, −30 y 20 en 0, −2 y −3. | 10−30 exp(−2t)+20 exp(−3t). Error 0. |
| P2.2 | 3 | T=9/(s+3)², H=1, escalón 4. Separar 4/s−4/(s+3)−12/(s+3)². Preguntar qué término introduce el factor t. | 4−4 exp(−3t)−12t exp(−3t). Error 0. |
| P2.3 | 3 | T=10/(s²+4s+13), H=1, escalón 5. Completar (s+2)²+9. Separar los términos de coseno y seno y calcular c(∞)=50/13. | (50/13)[1−exp(−2t)(cos(3t)+(2/3)sen(3t))]. Error 15/13. |
| P2.4 | 3 | T=2/(s+2), H=1, rampa r=2t. Usar R=2/s² y C=2/s²−1/s+1/(s+2). Formar R−C antes de tomar el límite. | 2t−1+exp(−2t). Error 1. |
| P2.5 | 3 | G=8/(s+2), H=1/2, escalón 6. Cerrar T=8/(s+6), hallar C=8/s−8/(s+6) y calcular ambos errores en campos distintos. | 8[1−exp(−6t)]. Seguimiento −2. **Comparador +2**. |

**Fe de erratas de P2.5.** La p. 3 imprime 1,2 como error del comparador. En régimen permanente, r=6, c=8 y la medición es Hc=4. Por lo tanto, r−Hc=6−4=2. Una pista útil pregunta qué señal llega a la entrada inversora. Aceptar −2 exclusivamente en el campo de seguimiento y +2 en el de comparador.

## Bode directo

Partir del lazo abierto L=GH. Pedir normalización, factores y multiplicidades, rectas de magnitud y fase, frecuencias de cruce, márgenes exactos y estabilidad del cierre negativo. Dibujar ejes logarítmicos con unidades y habilitar la curva exacta y sus marcadores al llegar al paso correspondiente. Para el cruce de magnitud leer MF sobre la fase. Para el cruce de fase leer MG sobre la magnitud. Confirmar la estabilidad con las raíces de D+N para L=N/D.

| ID | Pág. | L(s) y paso distintivo | Referencia exacta redondeada (frecuencias en rad/s) |
|---|---:|---|---|
| P3.1 | 4 | 10⁴/[(s+1)(s+10)(s+100)]. Extraer K=10 y sumar tres pendientes de polo. | MF +54,90° a 7,798. MG +21,74 dB a 33,317. Estable. |
| P3.2 | 4 | 2000/[s(s+1)(s+20)]. K=100. Incorporar el integrador desde el inicio y leer márgenes firmados. | MF −19,34° a 9,480. MG −13,56 dB a 4,472. Inestable. |
| P3.3 | 4 | 10⁵s²/[(s+1)(s+10)²(s+100)]. K=10. Dibujar el cero doble en el origen y el polo doble a 10. Buscar ambos cruces de magnitud. | Ascendente a 0,32441 y MF −21,88°. Descendente a 308,252 y MF +21,88°. MG infinito. Cierre estable. |
| P3.4 | 4 | 20000/[(s+1)(s+2)(s+10)]. K=1000. Acumular los aportes de los polos cercanos y distinguir ambos cruces. | MF −62,87° a 26,518. MG −34,07 dB a 5,657. Inestable. |
| P3.5 | 5 | 10⁷(s²+s+1)/[s(s+10)(s+100)(s+1000)]. K=10. Identificar el par de ceros complejos con ωn=1 y ζ=0,5. Construir el aporte cuadrático. | MF +19,99° a 3083,373. MG infinito. Cierre estable. |

**Lectura de P3.3.** La guía destaca el cruce descendente. Al resolver |L(jω)|=1 también aparece el ascendente. Con la convención firmada del tutor, reducir 180°+arg L al intervalo [−180°,180°). Los cuatro polos de D+N tienen parte real negativa. El alumno debe identificar el sentido de cada cruce y luego justificar estabilidad. En P3.3 y P3.5 «infinito» significa que no hay cruce finito de fase con el semieje real negativo para ω>0.

## Routh y LGR

Usar 1+KGH=0 con K>0. Pedir polos y ceros con multiplicidad, segmentos reales, centroide, ángulos y candidatos de dK/ds=0 con K=−D/N. Validar cada candidato por pertenencia al LGR y por su ganancia. Completar la primera columna de Routh y contrastar con el dibujo. Al aparecer un par imaginario, pedir ωc como número real positivo y rotular los polos como ±jωc.

| ID | Pág. | G y H | Hitos del recorrido |
|---|---:|---|---|
| P4.1 | 6 | G=1/(s+1), H=1/[(s+3)(s+5)] | Centroide −3, ángulos 60°, 180°, 300°. Ruptura −1,8453 con K≈3,0792. De s³+9s²+23s+15+K resulta 0<K<192 y ωc=√23. |
| P4.2 | 6 | G=s/(s+1), H=s/[(s+1)(s+2)] | Polo doble en −1, cero doble en 0. Centroide −4, asíntota 180°. D+KN=s³+(4+K)s²+5s+2. Sin ruptura real interior para K>0. Estable en todo ese dominio. |
| P4.3 | 6 | G=1/s, H=1/(s+6) | Centroide −3, ángulos 90°, 270°. En s²+6s+K, el discriminante se anula en K=9 y s=−3. Estable para todo K>0. |
| P4.4 | 6 | G=1/[s(s+1)], H=1/[(s+2)(s+3)] | Centroide −1,5, ángulos 45°, 135°, 225°, 315°. Aceptar ambas rupturas −2,6180 y −0,3820 con K=1. Descartar −1,5 con K<0. Usar Routh de cuarto orden para 0<K<10 y ωc=1. |
| P4.5 | 7 | G=(s+4)/s, H=1/[(s+1)(s+2)] | Centroide +0,5, ángulos 90°, 270°. Ruptura −0,45474 con K≈0,10807. De s³+3s²+(2+K)s+4K resulta 0<K<6 y ωc=√8. |

## Cómo usar estas referencias en QA

Durante la preparación se cotejaron los cinco cierres de bloques y las cinco respuestas temporales con SymPy. Se evaluó L(jω) y se buscaron cambios de signo de |L|−1 y de Im(L) para las cinco fichas de Bode, filtrando el semieje negativo para MG. Se calcularon los polos de D+N y los candidatos reales de ruptura de las cinco fichas LGR. Estos controles fundamentan las referencias del plan. La verificación de las gráficas interactivas, los correctores y la persistencia corresponde a la implementación.

Cada ficha implementada debe enlazar a su ID, identificar el método de comprobación y declarar unidad y tolerancia. Conservar precisión interna al corregir. En el solucionario, distinguir valores exactos, lecturas aproximadas y convenciones de signo.

## Criterios de corrección en la aplicación

- Bloques y Laplace. Comparación numérica de expresiones equivalentes en nueve muestras, con un mínimo de cinco valores de referencia finitos y tolerancia de 10⁻⁸ escalada. Los errores estacionarios son escalares en las unidades de la señal de entrada.
- Bode. Cruces por rectas ±0,065 décadas y márgenes ±2 dB o grados. Cruces exactos ±0,005 décadas y márgenes ±0,15 dB o grados. Acepta conversiones de Hz a rad/s y de radianes a grados. MG infinito se contesta como opción y no tiene marcador finito.
- Routh y LGR. Extremos y centroide ±0,01 en posición s, ángulos ±0,5°, rupturas ±0,025 en posición s, ganancia de ruptura ±0,005 y frecuencia de cruce ±0,01 rad/s. El intervalo estable se comprueba con la primera columna simbólica.

## Fichas y pistas

### P1.1

Toma X, signo negativo, cierre interno, serie y cierre exterior (pasos 1–5). **Pista.** En Σ2 vuelve X, ubicada antes del segundo bloque. **Error típico.** Usar C en el lazo interno.

Los identificadores de paso comienzan con `P1.1.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p11)

### P1.2

Signo positivo, cierre interno, serie y cierre exterior (pasos 1–4). **Pista.** El retorno unitario llega al terminal + de Σ2. **Error típico.** Perder el signo del bloque −2 o usar 1+G en el retorno positivo.

Los identificadores de paso comienzan con `P1.2.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p12)

### P1.3

Paralelo, producto en serie y cierre exterior (pasos 1–3). **Pista.** Ambas ramas reciben B y entran al segundo sumador por terminales positivos. **Error típico.** Multiplicar las dos ramas paralelas.

Los identificadores de paso comienzan con `P1.3.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p13)

### P1.4

Serie interna, cierre interno, serie exterior y cierre exterior (pasos 1–4). **Pista.** La ganancia 6 está antes del sumador interno. **Error típico.** Incluir 6 en el cálculo del lazo interior.

Los identificadores de paso comienzan con `P1.4.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p14)

### P1.5

Toma Y, primer cierre, segundo cierre, serie y cierre exterior (pasos 1–5). **Pista.** Seguir el retorno que entra a Σ3 hasta la salida de 3/(s+1). **Error típico.** Mover el retorno de Σ3 a la salida de 2/s.

Los identificadores de paso comienzan con `P1.5.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p15)

### P2.1

R(s), C(s), fracciones, c(t), polos de sE(s) y error (pasos 1–6). **Pista.** Calcular residuos en 0, −2 y −3. **Error típico.** Conservar el origen entre los polos de sE(s).

Los identificadores de paso comienzan con `P2.1.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p21)

### P2.2

R(s), C(s), fracciones, término repetido, c(t), polos de sE(s) y error (pasos 1–7). **Pista.** Incluir las potencias 1 y 2 de s+3. **Error típico.** Omitir el factor t del término repetido.

Los identificadores de paso comienzan con `P2.2.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p22)

### P2.3

R(s), C(s), fracciones, c(t), polos de sE(s) y error (pasos 1–6). **Pista.** Completar el cuadrado y ajustar el numerador del seno a 3. **Error típico.** Omitir el factor 2/3 del seno.

Los identificadores de paso comienzan con `P2.3.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p23)

### P2.4

R(s), C(s), fracciones, c(t), polos de sE(s) y error (pasos 1–6). **Pista.** Formar la diferencia antes de tomar el límite. **Error típico.** Evaluar por separado los límites infinitos de entrada y salida.

Los identificadores de paso comienzan con `P2.4.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p24)

### P2.5

T(s), R(s), C(s), fracciones, c(t), polos de sE(s), seguimiento y comparador (pasos 1–8). **Pista.** La señal de retorno es Hc y vale 4 en régimen permanente. **Error típico.** Usar −2 para el comparador o copiar el 1,2 del PDF.

Los identificadores de paso comienzan con `P2.5.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p25)

### P3.1

Normalizar y construir tres factores de primer orden. **Pista.** Sumar las pendientes en 1, 10 y 100 rad/s. **Error típico.** Leer los dos márgenes a la misma frecuencia.

Los identificadores de paso comienzan con `P3.1.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p31)

### P3.2

Incluir −90° del integrador desde el origen. **Pista.** Separar las frecuencias de cruce de fase y magnitud. **Error típico.** Cambiar de signo el MF negativo.

Los identificadores de paso comienzan con `P3.2.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p32)

### P3.3

Registrar el cruce ascendente y el descendente. **Pista.** Buscar cambios de signo de la magnitud en los dos lados de la banda. **Error típico.** Inferir inestabilidad a partir de un único MF firmado.

Los identificadores de paso comienzan con `P3.3.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p33)

### P3.4

Acumular los dos primeros efectos de polo. **Pista.** Los quiebres 1 y 2 rad/s tienen transiciones superpuestas. **Error típico.** Usar el cruce de 0 dB para leer el MG.

Los identificadores de paso comienzan con `P3.4.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p34)

### P3.5

Identificar el factor cuadrático con ωn=1 y ζ=0,5. **Pista.** Evaluar solo el factor en s=j para obtener su contribución local. **Error típico.** Usar dos ceros reales o confundir el aporte con la respuesta de todo L.

Los identificadores de paso comienzan con `P3.5.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p35)

### P4.1

Identificar tres polos simples y cerrar con D+K. **Pista.** Con K crítico la fila s¹ se anula y la fila s² da el auxiliar. **Error típico.** Aceptar el candidato que da K negativo.

Los identificadores de paso comienzan con `P4.1.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p41)

### P4.2

Contar el polo y el cero dobles con multiplicidad. **Pista.** El conteo impar se conserva a ambos lados de un extremo doble. **Error típico.** Aceptar como ruptura interior el polo doble en K=0.

Los identificadores de paso comienzan con `P4.2.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p42)

### P4.3

Resolver la ruptura real y armar Routh de orden dos. **Pista.** El discriminante de s²+6s+K se anula para K=9. **Error típico.** Confundir la raíz doble con pérdida de estabilidad.

Los identificadores de paso comienzan con `P4.3.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p43)

### P4.4

Introducir ambas rupturas en orden de izquierda a derecha y usar Routh de orden cuatro. **Pista.** El candidato central queda fuera de los segmentos. En K=10 usar el auxiliar 10s²+10. **Error típico.** Descartar una ruptura porque tiene el mismo K que la otra.

Los identificadores de paso comienzan con `P4.4.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p44)

### P4.5

Restar el cero −4 al sumar las posiciones para calcular el centroide. **Pista.** La primera columna da (6−K)/3 y en K=6 el auxiliar es 3s²+24. **Error típico.** Poner signo negativo al centroide o escribir jω en el campo de frecuencia.

Los identificadores de paso comienzan con `P4.5.`. [Prueba del ejercicio](QA_TUTOR_PARCIAL_20.md#p45)
