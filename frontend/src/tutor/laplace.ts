import {
  choose,
  expression,
  numeric,
  questions,
  partial as partialSource,
  type Exercise,
  type Question,
} from "./exercise";

const topic = "Laplace y error estacionario";
function lesson(
  id: string,
  page: string,
  formula: string,
  prompt: string,
  items: Question[],
  note?: string,
): Exercise {
  return {
    id,
    page,
    topic,
    formula,
    prompt,
    steps: questions(id, items),
    note,
  };
}

const response = (answer: string, hint: string) =>
  expression(
    "Antitransformada",
    "Escribí c(t) para t ≥ 0. Podés usar exp(), sin(), cos() y sqrt().",
    answer,
    hint,
    "Aplicá la antitransformada término por término y conservá los coeficientes.",
  );
const input = (amplitude: string) =>
  expression(
    "Entrada",
    "Escribí R(s), la transformada de la entrada.",
    amplitude + "/s",
    "La transformada de un escalón unitario es 1/s.",
    "La amplitud multiplica a 1/s.",
  );
const output = (answer: string) =>
  expression(
    "Salida en Laplace",
    "Escribí C(s).",
    answer,
    "Multiplicá la transferencia C/R por R(s).",
    "La ecuación usa condiciones iniciales nulas.",
  );
const closed = (answer: string) =>
  expression(
    "Cierre del lazo",
    "Escribí C(s)/R(s) usando s.",
    answer,
    "Para el retorno negativo usá G/(1+GH).",
    "Al sustituir G y H, multiplicá por el denominador común.",
  );
const partial = (term: string, value: number, hint: string) =>
  numeric(
    "Fracciones simples",
    "¿Cuál es el coeficiente de " + term + "?",
    value,
    hint,
    "Igualá coeficientes tras multiplicar por el denominador común.",
  );
const limit = (prompt: string, value: number, hint: string, why: string) =>
  numeric("Valor final", prompt, value, hint, why);

const originalLaplaceExercises = [
  lesson(
    "E1",
    "26 y 63",
    "G = 1/(s+2), H = 1/s, r(t) = 100",
    "Con retorno negativo, hallá c(t), el error del comparador y el error de seguimiento.",
    [
      closed("s/(s+1)^2"),
      input("100"),
      output("100/(s+1)^2"),
      response(
        "100t*exp(-t)",
        "Un denominador (s+a)² corresponde a t·exp(−at).",
      ),
      choose(
        "Condición del valor final",
        "¿Dónde están los polos de sC(s)?",
        ["En s = −1", "En s = 0", "En s = +1"],
        0,
        "Inspeccioná (s+1)².",
        "Los polos están en el semiplano izquierdo.",
      ),
      limit(
        "¿Cuánto vale c(∞)?",
        0,
        "t·exp(−t) tiende a cero.",
        "El límite de sC(s) es cero.",
      ),
      limit(
        "¿Cuánto vale el error final del comparador R−HC?",
        0,
        "El retorno integra la salida. Evaluá lim sH(s)C(s).",
        "El retorno llega a 100 y el comparador da 0.",
      ),
      limit(
        "¿Cuánto vale el error final de seguimiento R−C?",
        100,
        "Restá el valor final de la salida al nivel de la entrada.",
        "El seguimiento vale 100−0 = 100.",
      ),
    ],
    "El apunte calcula el error del comparador. El tutor pide además el de seguimiento.",
  ),
  lesson(
    "E2",
    "27",
    "G = 1/s, H = 1/(s+2), r(t) = K",
    "Hallá c(t) y ambos errores de régimen para el escalón de amplitud K.",
    [
      closed("(s+2)/(s+1)^2"),
      input("K"),
      output("K(s+2)/(s(s+1)^2)"),
      expression(
        "Fracciones simples",
        "Escribí el coeficiente de 1/s en función de K.",
        "2K",
        "Cancelá s y evaluá en s = 0.",
        "El denominador restante vale 1.",
      ),
      expression(
        "Fracciones simples",
        "Escribí el coeficiente de 1/(s+1)² en función de K.",
        "-K",
        "Cancelá (s+1)² y evaluá en s = −1.",
        "El factor s vale −1.",
      ),
      expression(
        "Fracciones simples",
        "Escribí el coeficiente de 1/(s+1) en función de K.",
        "-2K",
        "Compará los términos en s² al eliminar denominadores.",
        "Los coeficientes de 1/s y 1/(s+1) se cancelan en s².",
      ),
      response(
        "2K-2K*exp(-t)-Kt*exp(-t)",
        "Usá 1, exp(−t) y t·exp(−t) como parejas.",
      ),
      expression(
        "Valor final",
        "¿Cuánto vale c(∞) en función de K?",
        "2K",
        "Conservá el término constante.",
        "La salida llega a 2K y H(0) vale 1/2.",
      ),
      limit(
        "¿Cuál es el error final del comparador R−HC?",
        0,
        "La medida devuelta es H(0)c(∞).",
        "El retorno llega a K.",
      ),
      expression(
        "Seguimiento",
        "¿Cuál es el error final R−C en función de K?",
        "-K",
        "Restá 2K de la amplitud.",
        "El error de seguimiento vale K−2K.",
      ),
    ],
  ),
  lesson(
    "E3",
    "28 y 64",
    "C/R = 1/[(s+1)(s+2)], r(t) = 10",
    "Hallá c(t) y el error final de seguimiento.",
    [
      input("10"),
      output("10/(s(s+1)(s+2))"),
      partial("1/s", 5, "Cancelá s y probá s = 0."),
      partial("1/(s+1)", -10, "Cancelá s+1 y probá s = −1."),
      partial("1/(s+2)", 5, "Cancelá s+2 y probá s = −2."),
      response(
        "5-10*exp(-t)+5*exp(-2t)",
        "Cada 1/(s+a) corresponde a exp(−at).",
      ),
      limit(
        "¿Cuál es c(∞)?",
        5,
        "Los términos exponenciales se extinguen.",
        "Todos los polos de sC(s) tienen parte real negativa.",
      ),
      limit(
        "¿Cuál es el valor final de R−C?",
        5,
        "Restá c(∞) a 10.",
        "El error de seguimiento vale 10−5.",
      ),
    ],
  ),
  lesson(
    "E4",
    "29",
    "C/R = 1/[s(s+2)], r(t) = 1",
    "Hallá c(t) y estudiá el límite de R−C para el escalón unitario.",
    [
      choose(
        "Transferencia",
        "¿Qué relación entrega la consigna?",
        ["C/R, ya cerrada", "GH, aún abierta", "Solo H"],
        0,
        "Leé la definición del bloque.",
        "Aplicá la transferencia directamente a R(s).",
      ),
      input("1"),
      output("1/(s^2(s+2))"),
      partial("1/s²", 0.5, "Cancelá s² y probá s = 0."),
      partial("1/(s+2)", 0.25, "Cancelá s+2 y probá s = −2."),
      partial("1/s", -0.25, "Igualá el coeficiente de s²."),
      response("-1/4+t/2+exp(-2t)/4", "1/s² se convierte en t."),
      choose(
        "Valor final",
        "¿Qué término impide que c(∞) sea finito?",
        ["t/2", "−1/4", "exp(−2t)/4"],
        0,
        "Buscá el término que crece.",
        "El polo de sC(s) en el origen impide aplicar el teorema para un valor final finito.",
      ),
      choose(
        "Seguimiento",
        "¿Cómo se comporta R−C cuando t crece?",
        ["Diverge hacia −∞", "Tiende a cero", "Tiende a 1/4"],
        0,
        "La salida crece con pendiente positiva.",
        "1−c(t) decrece sin cota.",
      ),
    ],
  ),
  lesson(
    "E5",
    "30–31",
    "G = 1/s, H = 1/(s+1), r(t) = 1",
    "Cerrá el lazo negativo, hallá c(t) y evaluá el error de régimen.",
    [
      closed("(s+1)/(s^2+s+1)"),
      input("1"),
      output("(s+1)/(s(s^2+s+1))"),
      partial("1/s", 1, "Evaluá la igualdad en s = 0."),
      expression(
        "Fracciones simples",
        "Escribí el numerador que queda sobre s²+s+1 al quitar 1/s.",
        "-s",
        "Restá 1/s usando denominador común.",
        "C(s)=1/s−s/(s²+s+1).",
      ),
      numeric(
        "Completar cuadrados",
        "En (s+a)²+b, ¿cuánto vale a?",
        0.5,
        "Igualá 2a a 1.",
        "El desplazamiento del cuadrado vale 1/2.",
      ),
      numeric(
        "Completar cuadrados",
        "En (s+a)²+b, ¿cuánto vale b?",
        0.75,
        "La constante total es a²+b=1.",
        "La frecuencia es √3/2 rad/s.",
      ),
      choose(
        "Parejas de Laplace",
        "¿Qué términos aparecen al escribir −s = −(s+1/2)+1/2?",
        [
          "Coseno negativo y seno positivo",
          "Seno negativo y coseno positivo",
          "Solo un coseno",
        ],
        0,
        "El numerador desplazado aporta coseno.",
        "Para el seno se divide su coeficiente por √3/2.",
      ),
      response(
        "1-exp(-t/2)*cos(sqrt(3)*t/2)+exp(-t/2)*sin(sqrt(3)*t/2)/sqrt(3)",
        "Ambos términos oscilatorios tienen la envolvente exp(−t/2).",
      ),
      limit(
        "¿Cuál es el error final del comparador?",
        0,
        "c(∞) = 1 y H(0) = 1.",
        "El cierre es estable y ambos tipos de error llegan a cero.",
      ),
    ],
  ),
  lesson(
    "E6",
    "32",
    "G = 1/[sⁿ(s²+2s+15)], H = 1",
    "Buscá error nulo ante escalón, rampa y parábola. Comprobá cada cierre.",
    [
      numeric(
        "Tipo formal",
        "¿Cuál es el tipo mínimo para error nulo ante escalón?",
        1,
        "Contá polos en el origen.",
        "Con un integrador GH diverge como 1/s.",
      ),
      choose(
        "Estabilidad",
        "Con n = 1, ¿es estable s³+2s²+15s+1?",
        ["Estable", "Inestable"],
        0,
        "En el cúbico compará 2·15 con 1.",
        "Primera columna 1, 2, 29/2, 1.",
      ),
      numeric(
        "Tipo formal",
        "¿Cuál es el tipo mínimo para error nulo ante rampa?",
        2,
        "Para eliminar el error de rampa se requieren dos integradores.",
        "Formalmente sE(s) tiende a cero.",
      ),
      choose(
        "Estabilidad",
        "Con n = 2, ¿es estable s⁴+2s³+15s²+1?",
        ["Estable", "Inestable"],
        1,
        "Construí la primera columna. La fila s¹ tiene signo negativo.",
        "Primera columna 1, 2, 15, −2/15, 1. Hay dos cambios de signo.",
      ),
      numeric(
        "Tipo formal",
        "¿Cuál es el tipo mínimo para error nulo ante parábola?",
        3,
        "El escalón, la rampa y la parábola tienen denominadores s, s² y s³.",
        "Formalmente se necesita tipo 3.",
      ),
      choose(
        "Estabilidad",
        "Con n = 3, ¿es estable s⁵+2s⁴+15s³+1?",
        ["Estable", "Inestable"],
        1,
        "Armá la tabla conservando los coeficientes nulos.",
        "Primera columna 1, 2, 15, 1/15, −451/2, 1. Hay dos cambios de signo.",
      ),
      choose(
        "Interpretación",
        "¿En qué caso se confirma error nulo para el n mínimo de cada entrada?",
        ["Solo escalón", "Escalón y rampa", "Las tres entradas"],
        0,
        "La estabilidad del cierre habilita el teorema del valor final.",
        "Para cualquier n ≥ 2 hay coeficientes internos nulos en un polinomio mónico con término independiente 1. Un polinomio real estrictamente Hurwitz tiene todos sus coeficientes positivos.",
      ),
    ],
    "La tabla por tipo del manuscrito presupone estabilidad. Con n ≥ 2, este lazo concreto no es Hurwitz.",
  ),
];

const split = (answer: string, hint: string) =>
  expression("Fracciones simples", "Escribí la descomposición completa de C(s).", answer,
    hint, "La suma de las fracciones reconstruye C(s) y cada término tiene una inversa tabulada.");
const finalValue = (poles: string, distractors: string[], explanation: string) =>
  choose("Condición del valor final", "¿Cuáles son los polos de sE(s) para E=R−C?",
    [poles, ...distractors], 0, "Formá E(s) y simplificá sE(s) antes de leer sus polos.", explanation);
const tracking = (value: number, explanation: string) =>
  limit("¿Cuánto vale el error estacionario de seguimiento r−c?", value,
    "Calculá el límite de r(t)−c(t) o de s[R(s)−C(s)].", explanation);
const conditions = "Usá condiciones iniciales nulas y t ≥ 0. Hallá c(t) y el error estacionario.";

const partialLaplaceExercises = [
  lesson("P2.1", "3", "T = 6/[(s+2)(s+3)], H = 1, r(t) = 10", conditions, [
    input("10"), output("60/(s(s+2)(s+3))"),
    split("10/s-30/(s+2)+20/(s+3)", "Calculá los residuos en 0, −2 y −3."),
    response("10-30exp(-2t)+20exp(-3t)", "Cada polo simple en −a produce exp(−at)."),
    finalValue("−2 y −3", ["0, −2 y −3", "2 y 3"], "Multiplicar E por s elimina el polo de la entrada escalón."),
    tracking(0, "La salida final vale 10 y sigue exactamente al escalón."),
  ]),
  lesson("P2.2", "3", "T = 9/(s+3)², H = 1, r(t) = 4", conditions, [
    input("4"), output("36/(s(s+3)^2)"),
    split("4/s-4/(s+3)-12/(s+3)^2", "Incluí tanto 1/(s+3) como 1/(s+3)²."),
    choose("Polo repetido", "¿Qué término aporta un factor t al invertir C(s)?",
      ["1/(s+3)²", "1/(s+3)", "1/s"], 0, "Recordá la transformada de t·exp(−3t).",
      "La derivada respecto de s de 1/(s+3) corresponde a multiplicar por −t."),
    response("4-4exp(-3t)-12t*exp(-3t)", "El residuo del polo doble multiplica t·exp(−3t)."),
    finalValue("−3 doble", ["0 y −3", "−3 simple"], "Los dos factores s+3 se mantienen en el denominador de sE(s)."),
    tracking(0, "Ambos transitorios decaen y c(∞)=4."),
  ]),
  lesson("P2.3", "3", "T = 10/(s²+4s+13), H = 1, r(t) = 5", conditions, [
    input("5"), output("50/(s(s^2+4s+13))"),
    split("50/(13s)-50(s+2)/(13((s+2)^2+9))-100/(13((s+2)^2+9))",
      "Completá (s+2)²+9 y escribí el numerador del transitorio en función de s+2."),
    response("(50/13)*(1-exp(-2t)*(cos(3t)+(2/3)*sin(3t)))",
      "El término con s+2 da coseno. Para el seno el numerador tabulado es 3."),
    finalValue("−2 ± 3j", ["+2 ± 3j", "±3j"], "El desplazamiento s+2 produce amortiguamiento."),
    tracking(15/13, "La diferencia final es 5−50/13."),
  ]),
  lesson("P2.4", "3", "T = 2/(s+2), H = 1, r(t) = 2t", conditions, [
    expression("Entrada", "Escribí R(s) para la rampa.", "2/s^2",
      "La transformada de t es 1/s².", "La pendiente 2 multiplica esa transformada."),
    output("4/(s^2(s+2))"),
    split("2/s^2-1/s+1/(s+2)", "El polo doble está en el origen."),
    response("2t-1+exp(-2t)", "Invertí por separado la rampa, la constante y la exponencial."),
    finalValue("−2", ["0 y −2", "0"], "Los términos de rampa se cancelan y sE(s)=2/(s+2)."),
    tracking(1, "El error es 1−exp(−2t) aunque r y c crecen sin límite."),
  ]),
  lesson("P2.5", "3", "G = 8/(s+2), H = 1/2, r(t) = 6",
    conditions + " El retorno es negativo. Calculá también el error del comparador.", [
      closed("8/(s+6)"), input("6"), output("48/(s(s+6))"),
      split("8/s-8/(s+6)", "Igualá numeradores sobre s(s+6)."),
      response("8*(1-exp(-6t))", "El término constante viene del polo en el origen."),
      finalValue("−6", ["0 y −6", "+6"], "El error de seguimiento y el de comparador dan polos estables tras multiplicar por s."),
      tracking(-2, "La salida final supera en dos unidades a la referencia."),
      limit("¿Cuánto vale el error estacionario del comparador r−Hc?", 2,
        "La señal que llega a la entrada inversora es la mitad de la salida.",
        "Con r=6, c=8 y H=1/2, el sumador entrega 6−4=2."),
    ], "Fe de erratas de la p. 3: el error del comparador es +2. El error de seguimiento es −2."),
];

export const laplaceExercises = [
  ...originalLaplaceExercises,
  ...partialLaplaceExercises.map((exercise, index) => ({
    ...exercise,
    partial: partialSource(["Polos simples", "Polo doble", "Polos complejos", "Entrada rampa", "Retorno no unitario"][index]),
  })),
];
