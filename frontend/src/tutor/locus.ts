import {
  choose,
  expression,
  numeric,
  questions,
  type Exercise,
  type Question,
} from "./exercise";
import type { Step } from "./session";

type Model = {
  id: string;
  page: string;
  poles: [number, number, number];
  zero?: number;
  breakaway: number;
  derivative: string;
  discarded: string;
  note?: string;
  source?: string;
};
export type LocusStage = {
  stage: number;
  kind:
    | "pole"
    | "zero"
    | "center"
    | "angles"
    | "segment"
    | "break"
    | "branches"
    | "crossing";
  values: number[];
};
export type RouthLesson = {
  steps: Step[];
  cells: { label: string; row: number; col: number; stage: number }[];
};
export type LocusExercise = Exercise & {
  l0: string;
  layers: LocusStage[];
  routh: RouthLesson;
};

const models: Model[] = [
  {
    id: "L1",
    page: "17",
    poles: [-2, -1, 0],
    breakaway: -0.42264973,
    derivative: "3s^2+6s+2",
    discarded: "−1,577 queda entre −2 y −1, fuera del LGR.",
    source: "Recuperatorio 2025. G=1/(s+1), H=1/[s(s+2)].",
  },
  {
    id: "L2",
    page: "18",
    poles: [-3, -1, 0],
    zero: -2,
    breakaway: -0.534428768,
    derivative: "2s^3+10s^2+16s+6",
    discarded: "Los otros dos candidatos son complejos.",
  },
  {
    id: "L3",
    page: "19",
    poles: [-2, -1, 0],
    zero: -3,
    breakaway: -0.467911114,
    derivative: "2s^3+12s^2+18s+6",
    discarded:
      "Los candidatos cerca de −3,879 y −1,653 quedan fuera de los segmentos y dan K negativo.",
  },
  {
    id: "L4",
    page: "20 y 62",
    poles: [-3, -2, 0],
    zero: -1,
    breakaway: -2.465571232,
    derivative: "2s^3+8s^2+10s+6",
    discarded: "Los otros dos candidatos son complejos.",
    note: "En el repaso, el polo intermedio se toma de s+2 y vale −2; la transferencia y el dibujo lo confirman.",
  },
  {
    id: "L5",
    page: "21",
    poles: [-3, -1, 0],
    breakaway: -0.45141623,
    derivative: "3s^2+8s+3",
    discarded: "−2,215 está entre −3 y −1 y da K negativo.",
  },
  {
    id: "L6",
    page: "61",
    poles: [-3, -2, 0],
    breakaway: -0.784749562,
    derivative: "3s^2+10s+6",
    discarded: "−2,549 queda entre −3 y −2.",
    note: "La p. 61 invierte las desigualdades al copiar el intervalo. La primera columna da 0 < K < 30.",
  },
];

function coefficients(poles: number[], zero?: number) {
  const [, first, second] = [...poles].reverse();
  const a2 = -first - second,
    b0 = first * second;
  const b = zero === undefined ? String(b0) : "(" + b0 + "+K)";
  const factor = zero === undefined ? 1 : -zero;
  const c = factor === 1 ? "K" : factor + "K";
  return { a2, b0, b, c, factor };
}

function routhQuestions(model: Model, startIndex = 0) {
  const { a2, b0, b, c, factor } = coefficients(model.poles, model.zero);
  const b1 =
    "(" +
    a2 * b0 +
    (model.zero === undefined
      ? "-K"
      : a2 === factor
        ? ""
        : "+" + (a2 - factor) + "K") +
    ")/" +
    a2;
  const characteristic = "s^3+" + a2 + "s^2+" + b + "s+" + c;
  const items: Question[] = [];
  const cells: RouthLesson["cells"] = [];
  function cell(
    row: number,
    col: number,
    label: string,
    hint: string,
    why: string,
  ) {
    cells.push({ label, row, col, stage: startIndex + items.length });
    items.push(
      expression(
        "Tabla de Routh",
        "Fila s^" +
          (3 - row) +
          ", columna " +
          (col + 1) +
          ". Ingresá la celda.",
        label,
        hint,
        why,
      ),
    );
  }
  items.push(
    expression(
      "Polinomio característico",
      "Ingresá el polinomio de 1+KL₀(s)=0, con coeficiente líder 1.",
      characteristic,
      "Para L₀=N/D, el polinomio es D+KN.",
      "La ganancia K aparece una sola vez.",
    ),
  );
  cell(
    0,
    0,
    "1",
    "Tomá los coeficientes de s³ y s.",
    "El coeficiente líder es 1.",
  );
  cell(
    0,
    1,
    b,
    "La segunda celda toma el coeficiente de s.",
    "La fila s³ usa las potencias impares.",
  );
  cell(
    1,
    0,
    String(a2),
    "Tomá los coeficientes de s² y s⁰.",
    "La fila s² usa las potencias pares.",
  );
  cell(
    1,
    1,
    c,
    "Tomá el término independiente.",
    "La ganancia multiplica el término independiente de N.",
  );
  cell(
    2,
    0,
    b1,
    "Usá (a₂·b−c)/a₂.",
    "La celda combina las primeras dos filas.",
  );
  cell(
    2,
    1,
    "0",
    "Completá con ceros al faltar columnas.",
    "Los términos disponibles terminan en la segunda columna.",
  );
  cell(
    3,
    0,
    c,
    "La última fila conserva el término independiente cuando b₁≠0.",
    "La columna se estudia con b₁ positivo; b₁=0 requiere el auxiliar.",
  );
  const critical = model.zero === undefined ? a2 * b0 : undefined;
  const range = critical === undefined ? "K > 0" : "0 < K < " + critical;
  items.push(
    choose(
      "Estabilidad",
      "¿Para qué ganancias positivas es estrictamente estable?",
      [range, "Solo para K = 0", "Para ninguna K positiva"],
      0,
      "Imponé que las cuatro entradas de la primera columna sean positivas.",
      "El rango sale de b₁>0 y c>0.",
    ),
  );
  if (critical !== undefined) {
    items.push(
      numeric(
        "Ganancia crítica",
        "¿Para qué K positivo se anula la fila s¹?",
        critical,
        "Igualá b₁ a cero.",
        "En ese K se usa el auxiliar de la fila s².",
      ),
    );
    items.push(
      expression(
        "Polinomio auxiliar",
        "Escribí el auxiliar en la ganancia crítica.",
        a2 + "s^2+" + critical,
        "Leé la fila s² y sustituí K crítico.",
        "Las raíces de este auxiliar están sobre el eje imaginario.",
      ),
    );
    items.push(
      numeric(
        "Cruce imaginario",
        "¿Cuál es la frecuencia real positiva del cruce?",
        Math.sqrt(b0),
        "Sustituí s=jω en el auxiliar.",
        "Las posiciones son ±jω; la frecuencia se expresa como un número real positivo.",
        "rad/s",
        0.015,
      ),
    );
    items.push(
      choose(
        "Estabilidad",
        "¿Qué sucede al pasar de K crítico a una K mayor?",
        [
          "Un par pasa al semiplano derecho",
          "El lugar termina",
          "Los tres polos permanecen a la izquierda",
        ],
        0,
        "Seguí el signo de b₁ al aumentar K.",
        "La primera columna adquiere dos cambios de signo para K>crítico.",
      ),
    );
  } else {
    items.push(
      choose(
        "Cruce imaginario",
        "¿Existe K crítico positivo?",
        ["No existe", "Sí, en K=0", "Sí, al anular el centroide"],
        0,
        "Revisá el rango obtenido con Routh.",
        "Todos los K positivos dan primera columna positiva.",
      ),
    );
  }
  return { items, cells, b0, critical };
}

const rootCandidate = (real: number) => ({
  ...numeric(
    "Ruptura",
    "Ubicá sobre el eje real el candidato válido. Redondeá a dos decimales.",
    real,
    "Un candidato real debe pertenecer a un segmento válido y dar K≥0.",
    "La ruptura conecta las dos ramas del segmento real.",
    undefined,
    0.06,
  ),
  pick: "real" as const,
});
const segment = (a: number, b: number) =>
  "(" +
  (a === -Infinity ? "−∞" : String(a)) +
  "; " +
  (b === Infinity ? "+∞" : String(b)) +
  ")";

function locus(model: Model): LocusExercise {
  const { id, page, poles, zero, breakaway, derivative, discarded, note } =
    model;
  const denominator =
    "s" +
    poles
      .filter((p) => p !== 0)
      .map((p) => "(s+" + -p + ")")
      .join("");
  const l0 =
    (zero === undefined ? "1" : "(s+" + -zero + ")") + "/[" + denominator + "]";
  const layers: LocusStage[] = [];
  const items: Question[] = [];
  function add(
    question: Question,
    kind?: LocusStage["kind"],
    values: number[] = [],
  ) {
    if (kind) layers.push({ stage: items.length, kind, values });
    items.push(question);
  }
  poles.forEach((p, i) =>
    add(
      {
        ...numeric(
          "Polos abiertos",
          "Marcá en el eje real el polo " +
            (i + 1) +
            " de izquierda a derecha.",
          p,
          "Igualá cada factor del denominador a cero.",
          "Cada rama comienza en un polo abierto.",
          undefined,
          0.095,
        ),
        pick: "real",
      },
      "pole",
      [p],
    ),
  );
  if (zero === undefined)
    add(
      numeric(
        "Ceros",
        "¿Cuántos ceros finitos tiene L₀?",
        0,
        "Inspeccioná el numerador.",
        "El numerador es constante.",
      ),
    );
  else
    add(
      {
        ...numeric(
          "Ceros",
          "Marcá el cero finito en el eje real.",
          zero,
          "Igualá el numerador a cero.",
          "Una rama termina en este cero.",
          undefined,
          0.095,
        ),
        pick: "real",
      },
      "zero",
      [zero],
    );
  const real = [
    -Infinity,
    ...[...poles, ...(zero === undefined ? [] : [zero])].sort((a, b) => a - b),
    Infinity,
  ];
  const intervals = real.slice(0, -1).map((a, i) => [a, real[i + 1]] as const);
  intervals.forEach(([a, b], i) => {
    const active = (intervals.length - 1 - i) % 2 === 1;
    add(
      choose(
        "Segmentos reales",
        "¿Pertenece " + segment(a, b) + " al LGR para K>0?",
        ["Sí pertenece", "No pertenece"],
        active ? 0 : 1,
        "Contá los polos y ceros que quedan a la derecha.",
        "Se necesita una cantidad impar de polos y ceros a la derecha del punto.",
      ),
      active ? "segment" : undefined,
      [a, b],
    );
  });
  const count = zero === undefined ? 3 : 2;
  add(
    numeric(
      "Asíntotas",
      "¿Cuántas ramas se van al infinito?",
      count,
      "Restá los ceros finitos de los polos.",
      "Las demás ramas terminan en ceros finitos.",
    ),
  );
  const center = (poles.reduce((a, b) => a + b, 0) - (zero ?? 0)) / count;
  add(
    {
      ...numeric(
        "Centroide",
        "Ubicá el centroide σa. Redondeá a dos decimales.",
        center,
        "Restá la suma de ceros de la de polos y dividí por n−m.",
        "Desde este punto se dibujan las asíntotas.",
        undefined,
        0.08,
      ),
      pick: "real",
    },
    "center",
    [center],
  );
  const angles = count === 3 ? [60, 180, 300] : [90, 270];
  add(
    choose(
      "Asíntotas",
      "Elegí los ángulos de las asíntotas desde el eje real positivo.",
      ["60°, 180°, 300°", "90°, 270°", "0°, 120°, 240°"],
      count === 3 ? 0 : 1,
      "Usá 180°·(2q+1)/(n−m).",
      "Los ángulos se miden en sentido antihorario.",
    ),
    "angles",
    [center, ...angles],
  );
  add(
    expression(
      "Ruptura",
      "Escribí K(s) a partir de 1+KL₀(s)=0.",
      "-(" +
        denominator +
        ")/" +
        (zero === undefined ? "1" : "(s+" + -zero + ")"),
      "Despejá K = −D/N.",
      "Una ruptura puede ocurrir donde dK/ds=0.",
    ),
  );
  add(
    choose(
      "Ruptura",
      "¿Qué operación produce los candidatos a ruptura?",
      [
        "Igualar dK/ds a cero",
        "Igualar K a uno",
        "Igualar el denominador D a cero",
      ],
      0,
      "Buscá extremos de K sobre el eje real.",
      "El numerador de dK/ds permite resolver " + derivative + " = 0.",
    ),
  );
  add(rootCandidate(breakaway), "break", [breakaway]);
  add(
    choose(
      "Ruptura",
      "¿Qué criterio valida el candidato real?",
      [
        "Está en un segmento del LGR y K≥0",
        "Es el más cercano al centroide",
        "Tiene el menor módulo",
      ],
      0,
      "Evaluá K(s) y contá los polos y ceros a la derecha.",
      discarded,
    ),
    "branches",
  );
  const routh = routhQuestions(model, items.length);
  items.push(...routh.items);
  if (routh.critical !== undefined)
    layers.push({
      stage: items.length - 2,
      kind: "crossing",
      values: [Math.sqrt(routh.b0)],
    });
  return {
    id,
    page,
    topic: "Routh y LGR",
    formula: "L₀(s) = " + l0,
    l0: l0.replace(/[\[\]]/g, (ch) => (ch === "[" ? "(" : ")")),
    prompt: [
      model.source,
      "Dibujá el lugar para K≥0 y estudiá la estabilidad con Routh.",
    ]
      .filter(Boolean)
      .join(" "),
    steps: questions(id, items),
    layers,
    routh: {
      steps: questions(id + "-routh", routh.items),
      cells: routhQuestions(model).cells,
    },
    note,
  };
}

export const locusExercises = models.map(locus);
const r1 = routhQuestions(models[0]);
export const routhExercise = {
  id: "R1",
  page: "16",
  topic: "Routh y LGR",
  formula: "s³ + 3s² + 2s + K = 0",
  prompt:
    "Armá la tabla, encontrá el rango estable y hallá la frecuencia en el límite de estabilidad.",
  steps: questions("R1", r1.items),
  cells: r1.cells,
} satisfies Exercise & { cells: RouthLesson["cells"] };

export const routhCells = (exercise: LocusExercise) => {
  const offset = exercise.steps.length - exercise.routh.steps.length;
  return exercise.routh.cells.map((cell) => ({
    ...cell,
    stage: cell.stage + offset,
  }));
};
