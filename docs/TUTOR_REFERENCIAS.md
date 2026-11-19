# Referencias de corrección del Tutor

Las páginas se cuentan desde la portada del manuscrito «FINAL TEORÍA DE CONTROL - LF», que se aporta por separado. Esta guía es una referencia docente. El tutor presenta cada valor cuando se confirma su paso o cuando el estudiante abre explícitamente una resolución. Los decimales redondeados se usan para cotejar resultados. Las fichas interactivas contienen los criterios por paso.

## Bode directo

Los cinco originales piden trazar magnitud y fase para obtener MF y MG. Para cada binomio se extrae su constante, se identifica signo y multiplicidad y se empieza desde la frecuencia positiva indicada. En magnitud se suman dB y se conserva continuidad al pasar de intervalo. En fase se suma en la rama continua, con transiciones entre ωb/10 y 10ωb. Un polo simple aporta −20 dB/década y −90° finales; un cero simple aporta los mismos valores con signo opuesto. Se calcula MF firmado como 180°+φ reducido a [−180°, 180°), y MG como −M en un encuentro de fase con la dirección real negativa. Las lecturas por rectas usan ±2 dB o grados y ±0,065 décadas para cruces. Las lecturas exactas usan ±0,15 dB o grados y ±0,005 décadas. La interfaz contempla Hz y radianes como unidades alternativas compatibles.

### B1 · p. 33

- Consigna y modelo. Hallar MG y MF de 10⁵/[s(s+100)(s+1000)]. Se extrae 100·1000. Queda K=1 y hay polos simples en 0, −100 y −1000.
- Construcción. Desde 0,01 rad/s, M=40 dB y la pendiente es −20 dB/década. M(100)=−40 dB, M(1000)=−80 dB y M(10⁴)=−140 dB. Las pendientes salientes son −40 y −60 dB/década. La fase arranca en −90°; las transiciones [10, 1000] y [100, 10⁴] se superponen y dan −135° a 100 y −225° a 1000 rad/s.
- Márgenes por rectas. MF=90° a 1 rad/s y MG=60 dB a √10⁵≈316,23 rad/s. En el manuscrito se anotan los incrementos de fase junto a los límites de intervalo; el valor en un límite se toma de la suma continua.
- Evaluación exacta. MF≈89,37° a 0,99995 rad/s y MG≈60,83 dB a 316,23 rad/s. El cierre unitario negativo es estable por Routh, pues 1100·10⁵ > 10⁵.

### B2 · p. 34

- Modelo. 10⁶s(s+10)/[(s+1)²(s+100)²]. K=1000 (60 dB); cero simple en el origen y en −10, polos dobles en −1 y −100. El apunte inicia en 0,01 rad/s. El tutor extiende el eje a 0,0001 para incluir el cruce ascendente. M(1), M(10), M(100) son 60, 40 y 40 dB. Pendientes salientes por intervalo: +20, −20, 0 y −40 dB/década.
- Fase. Parte de +90°, con fases en 1, 10, 100 y 1000 de 0°, −45°, −90° y −180°. Rectas: MF=−90° a 0,001 rad/s y 0° a 1000 rad/s; el encuentro con la meseta de −180° empieza allí y el MG leído es 0 dB.
- Exacta. Cruces de 0 dB en 0,001000001 y 995,0123 rad/s, MF≈−90,11° y 11,02°. La fase tiende a −180° con ω creciente, sin cruce finito de fase. MG infinito. El cierre unitario negativo tiene cuatro raíces en el semiplano izquierdo. La afirmación de inestabilidad del dibujo no se aplica al modelo exacto.

### B3 · p. 35

- Modelo. 10(s+1)/[s(s+10)²]. K=0,1 (−20 dB), polo simple en el origen, cero en −1 y polo doble en −10. Desde 0,01 rad/s, M=20 dB y φ=−90°. Las pendientes salientes son −20, 0 y −40 dB/década. M(1)=M(10)=−20 dB.
- Rectas. MF=90° a 0,1 rad/s y MG=60 dB al empezar la meseta de −180° a 100 rad/s.
- Exacta. MF≈94,59° a 0,100494 rad/s. MG infinito. La fase es −90°+atan(ω)−2atan(ω/10) en grados y queda por encima de −180° para toda ω>0. La lectura de MG del manuscrito corresponde a las rectas.

### B4 · p. 36

- Modelo. 10⁻⁵(s+10)(s+100)(s+1000)/s³. K=10 (20 dB), tres integradores y tres ceros simples. En 0,01 rad/s la magnitud inicial es 140 dB y la fase es −270°. Las pendientes son −60, −40, −20 y 0 dB/década. En 10, 100 y 1000 rad/s, M vale −40, −80 y −100 dB. La fase suma −225°, −135° y −45°, y se nivela en 0° a 10⁴ rad/s.
- Rectas. MF=−75° a 10^(1/3) rad/s y MG=60 dB a √1000 rad/s. El manuscrito anota MF≈−70° y MG≈50 dB. El primer valor es una lectura aproximada. El segundo resulta de un nivel de magnitud distinto al que da la suma continua.
- Exacta. MF≈−76,38° a 2,17121 rad/s y MG≈58,26 dB a 30,0150 rad/s. Dos raíces del cierre unitario negativo tienen parte real positiva.

### B5 · p. 37

- Modelo. 10⁵s²/[(s+10)(s+100)(s+1000)]. K=0,1 (−20 dB), cero doble en el origen y tres polos simples. Desde 0,01 rad/s, M=−100 dB y φ=+180°. Las pendientes salientes son +40, +20, 0 y −20 dB/década; M(10)=20 dB, M(100)=M(1000)=40 dB.
- Rectas. Cruces de 0 dB a √10 y 10⁵ rad/s, con MF firmado −22,5° y 90°. Se conserva +180° como rama inicial. La meseta inicial aproxima el límite en el origen y no se cuenta como cruce aislado de fase.
- Exacta. Cruces ascendente a 3,24320 y descendente a 99994,95 rad/s, con MF≈−20,01° y 90,64°. No hay cruce finito de fase y el MG es infinito. El primer MF del manuscrito da en valor absoluto la distancia hacia +180°. La estabilidad del cierre unitario negativo se confirma por las tres raíces en el semiplano izquierdo.

**Comprobación.** Se reconstruyeron las cinco transferencias mediante las constantes de los factores. Se contrastaron las curvas exactas con la evaluación del cociente de polinomios en jω. La comparación numérica con `control.stability_margins` se restringió a ω>0 porque la rutina puede reportar el origen con ganancia nula como candidato degenerado. Los polos del cierre se verificaron con las raíces de D+N.

## Routh y lugar de las raíces

En las fichas L1–L6 se parte de L₀=N/D y se usa D+KN. Los segmentos se admiten si el número de polos y ceros a su derecha es impar. Un candidato de dK/ds=0 se valida con s real dentro del lugar y K=−D/N≥0. Las ramas se calculan con el motor del laboratorio. Los valores decimales de ruptura en el eje admiten ±0,06, tanto por toque como por campo. La frecuencia de cruce se pide real y positiva, con ±0,015 rad/s.

### R1 · p. 16

Para s³+3s²+2s+K, las primeras filas son (1,2) y (3,K). La primera columna es (1,3,(6−K)/3,K). Rango 0<K<6. El auxiliar a K=6 es 3s²+6; el par está en ±j√2 y ωc=√2 rad/s. A K>6 hay dos cambios de signo.

### L1 · p. 17

G=1/(s+1), H=1/[s(s+2)]. Polos {0,−1,−2} y ningún cero. Segmentos (−∞,−2), (−1,0). Centroide −1 y ángulos 60°, 180°, 300°. De 3s²+6s+2=0 se acepta −0,42265 y se descarta −1,57735 por quedar fuera del lugar. Característico y rango iguales a R1.

### L2 · p. 18

L₀=(s+2)/[s(s+1)(s+3)]. Polos {0,−1,−3}, cero −2. Segmentos (−3,−2), (−1,0). Centroide −1 y ángulos 90°, 270°. De 2s³+10s²+16s+6=0 queda −0,53443; los otros candidatos son complejos. Característico s³+4s²+(3+K)s+2K, con b₁=(12+2K)/4. Estable para K>0, sin cruce imaginario positivo.

### L3 · p. 19

L₀=(s+3)/[s(s+1)(s+2)]. Polos {0,−1,−2}, cero −3. Segmentos (−3,−2), (−1,0). Centroide 0 y ángulos 90°, 270°. De 2s³+12s²+18s+6=0 queda −0,46791. Se descartan −3,87939 y −1,65270 por región y K negativo. El valor manuscrito −0,463 aproxima el mismo punto. Característico s³+3s²+(2+K)s+3K; b₁=2, estable para K>0.

### L4 · pp. 20 y 62

L₀=(s+1)/[s(s+2)(s+3)]. Polos {0,−2,−3}, cero −1. Segmentos (−3,−2), (−1,0). Centroide −2 y ángulos 90°, 270°. De 2s³+8s²+10s+6=0 queda −2,46557; los otros candidatos son complejos. Característico s³+5s²+(6+K)s+K y b₁=(30+4K)/5. Estable para K>0. En el rótulo del repaso falta el signo en el polo intermedio; la transferencia y el dibujo confirman −2.

### L5 · p. 21

L₀=1/[s(s+1)(s+3)]. Polos {0,−1,−3}, ningún cero. Segmentos (−∞,−3), (−1,0). Centroide −4/3 y ángulos 60°, 180°, 300°. De 3s²+8s+3=0 queda −0,45142; −2,21525 está fuera del lugar. Característico s³+4s²+3s+K, estable con 0<K<12. Para K=12 el auxiliar 4s²+12 da ±j√3 y para K>12 dos polos con parte real positiva.

### L6 · p. 61

L₀=1/[s(s+2)(s+3)]. Polos {0,−2,−3}, ningún cero. Segmentos (−∞,−3), (−2,0). Centroide −5/3 y ángulos 60°, 180°, 300°. De 3s²+10s+6=0 queda −0,78475; −2,54858 está fuera del lugar. Característico s³+5s²+6s+K, estable con 0<K<30. A K=30, auxiliar 5s²+30 y polos ±j√6. Se corrige la inversión de desigualdades en la p. 61.

## Álgebra de bloques

La consigna original se representa como una red con los signos rotulados en cada entrada de sumador. Los equivalentes admiten cualquier forma algebraica reconocida por el corrector. El test `tutor.test.ts` plantea un sistema de ecuaciones nodales para cada grafo y coteja el equivalente de cada entrada. También altera un signo en D10 y mueve una toma en D15 para verificar que cambie el resultado.

### D1 · p. 2, penúltimo esquema

M=UG₁, N=UG₂ y Y=M−N. Y/U=G₁−G₂.

### D2 · p. 2, último esquema

M=U−G₂Y, Y=G₁M. Y/U=G₁/(1+G₁G₂).

### D3 · p. 3, arriba

a=R−HY, b=G₁a, c=G₂b, Y=G₃c. Y/R=G₁G₂G₃/(1+HG₁G₂G₃).

### D4 · p. 3, abajo

X=G₁R+R, U=G₂X, C=U+R. C/R=G₁G₂+G₂+1.

### D5 · p. 4, arriba

U=G₃C−G₄C, E=R+U, C=G₁E+G₂E. C/R=(G₁+G₂)/[1−(G₁+G₂)(G₃−G₄)].

### D6 · p. 4, abajo

E=R−H₁M, M=GE, C=M+H₂E. H₁ mide M. C/R=(G+H₂)/(1+GH₁).

### D7 · pp. 5–6

A=R−C+H₁X, Z=G₁A−CH₂, X=G₂Z, C=G₃X. Al desplazar el tercer sumador antes de G₁ se usa H₂/G₁ para preservar Z. Se reduce primero G₁G₂ con retorno positivo H₁, luego el lazo de H₂ y por último el retorno unitario negativo. C/R=G₁G₂G₃/[1−G₁G₂H₁+H₂G₂G₃+G₁G₂G₃].

### D8 · p. 7

X=[5/(s+2)](U+4X+Y), Y=X/s. Trasladar la toma antes del integrador exige 1/s en la rama movida, de modo que el retorno positivo es 4+1/s. X/U=5s/(s²−18s−5) y Y/U=5/(s²−18s−5).

### D9 · p. 8, arriba

A=G₁(R−H₁C), B=A+D, C=G₂B. Para C/R se impone D=0 y se obtiene G₁G₂/(1+G₁G₂H₁). Para C/D se impone R=0 y se obtiene G₂/(1+G₁G₂H₁).

### D10 · pp. 8–9 y 58

X=K₁(R−C−H₁X), Y=K₂(X+Y), C=K₃Y. Se reducen los retornos internos a K₁/(1+K₁H₁) y K₂/(1−K₂). Resultado C/R=K₁K₂K₃/[(1+K₁H₁)(1−K₂)+K₁K₂K₃]. La p. 9 usa 1−GH para el retorno exterior; el dibujo y la p. 58 confirman que es negativo y corresponde 1+GH.

### D11 · pp. 10–11 y 59–60

A=R−G₂C−K₂X, V=G₁A−K₁C, X=G₄V y C=G₃X. La toma al trasladarse a C pasa de K₂ a K₂/G₃. C/R=G₁G₃G₄/[1+K₁G₃G₄+G₁G₄K₂+G₁G₂G₃G₄].

Los datos originales son G₁=1/(s+4), G₂=1/(s+6), G₃=1/(s²+4), G₄=1/s, K₁=12, K₂=10. En la p. 59 G₃=1/(s²+9) y se muestra la toma original. Con q=4 o q=9, C/R=(s+6)/[s(s+4)(s+6)(s²+q)+12(s+4)(s+6)+10(s+6)(s²+q)+1].

### D12 · pp. 12 y 58

A=R−C, B=G₁A, D=B+C y C=G₂D. Por ecuaciones resulta C/R=G₁G₂/(1−G₂+G₁G₂). Por reducción, se cierra primero G₂/(1−G₂), se pone en serie G₁ y se cierra el lazo exterior negativo. Ambos recorridos están en el tutor.

### D13 · pp. 13–14

A=K₁R, B=A−CK₄, D=B−CK₃, F=K₂D+N, C=F/s. Sea d=K₂(K₃+K₄). C/R=K₁K₂/(s+d), C/N=1/(s+d). Se requiere d>0 para aplicar valor final. Error R−C ante escalón de referencia: 1−K₁/(K₃+K₄), anulable con K₁=K₃+K₄. Error ante escalón de perturbación: −1/d, diferente de cero para ganancias finitas con d>0.

### D14 · p. 57, arriba

X=A(R+C−BX), C=DX. El retorno B toma X y se resta; el exterior toma C y se suma. C/R=AD/(1+AB−AD).

### D15 · p. 57, abajo

E=R−H₁X, X=GE, C=X+H₂E. C/R=(G+H₂)/(1+GH₁). El desarrollo manuscrito usa H₁ sobre la salida del paralelo; la toma original está en X, antes de la suma.

## Laplace y error estacionario

Las cantidades de tiempo se interpretan para t≥0 con condiciones iniciales nulas. Se cotejan las fracciones parciales al recomponer C(s) y se aplica valor final solamente si los polos de sF(s) satisfacen el criterio. Las expresiones equivalentes se comparan en varios puntos del dominio representado; el corrector no hace una demostración simbólica general.

### E1 · pp. 26 y 63

Escalón 100, G=1/(s+2), H=1/s, retorno negativo. C/R=s/(s+1)², R=100/s, C=100/(s+1)² y c(t)=100t·exp(−t). El apunte calcula R−HC, que tiende a 0. R−C tiende a 100. El polo de sC(s) está en −1.

### E2 · p. 27

Escalón de amplitud K, G=1/s, H=1/(s+2). C/R=(s+2)/(s+1)² y C=2K/s−2K/(s+1)−K/(s+1)². Por tanto, c(t)=2K−2K·exp(−t)−Kt·exp(−t). R−HC tiende a 0 y R−C a −K. K representa amplitud de entrada.

### E3 · pp. 28 y 64

Escalón 10 y C/R=1/[(s+1)(s+2)]. C=5/s−10/(s+1)+5/(s+2). c(t)=5−10exp(−t)+5exp(−2t). R−C tiende a 5. Ambas páginas coinciden.

### E4 · p. 29

C/R ya cerrada, 1/[s(s+2)], y escalón unitario. C=−1/(4s)+1/(2s²)+1/[4(s+2)]. c(t)=−1/4+t/2+exp(−2t)/4. El polo en cero de sC(s) impide inferir un valor final finito. El término t/2 prueba que R−C diverge a −∞.

### E5 · pp. 30–31

G=1/s, H=1/(s+1), escalón unitario. C/R=(s+1)/(s²+s+1), C=1/s−s/(s²+s+1). Completar (s+1/2)²+3/4 y reescribir −s=−(s+1/2)+1/2. c(t)=1−exp(−t/2)cos(√3t/2)+exp(−t/2)sin(√3t/2)/√3. El cierre es estable y ambos errores tienden a 0.

### E6 · p. 32

G=1/[sⁿ(s²+2s+15)], H=1. Para escalón, rampa y parábola normalizada los tipos mínimos formales son 1, 2 y 3. Para n=1 el característico es s³+2s²+15s+1 y la primera columna de Routh es positiva. Para n=2 y n=3 aparecen dos cambios de signo. Para todo n≥2 hay coeficientes internos nulos en el polinomio mónico con término independiente positivo, lo que excluye Hurwitz estricto en esta familia. El error nulo efectivo se verifica con n=1 para escalón. Se conserva la conclusión formal por tipo del manuscrito como paso previo al control de estabilidad.
