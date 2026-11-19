import {
  choose,
  expression,
  numeric,
  partial,
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

type PartialLocus = {
  title: string;
  g: string;
  h: string;
  poles: number[];
  zeros: number[];
  derivative: string;
  breaks: [position: number, gain: number][];
  candidates: string;
  polynomial: string;
  table: string[][];
  critical?: { gain: number; omega: number; auxiliary: string; why: string };
};

const partialModels: PartialLocus[] = [
  {
    title: "Tres polos y cruce imaginario", g: "1/(s+1)", h: "1/((s+3)(s+5))",
    poles: [-5, -3, -1], zeros: [], derivative: "3s^2+18s+23",
    breaks: [[-3+2/Math.sqrt(3), 16/(3*Math.sqrt(3))]],
    candidates: "El candidato cercano a −4,155 queda fuera de los segmentos y da K negativo.",
    polynomial: "s^3+9s^2+23s+15+K",
    table: [["1", "23"], ["9", "15+K"], ["(192-K)/9", "0"], ["15+K", "0"]],
    critical: { gain: 192, omega: Math.sqrt(23), auxiliary: "9s^2+207",
      why: "La fila s¹ se anula cuando 192−K=0." },
  },
  {
    title: "Polo y cero dobles", g: "s/(s+1)", h: "s/((s+1)(s+2))",
    poles: [-2, -1, -1], zeros: [0, 0], derivative: "s^3-5s-4",
    breaks: [], candidates: "−1 es un polo. Los otros candidatos reales están fuera de (−∞,−2) y dan K negativo.",
    polynomial: "s^3+(4+K)s^2+5s+2",
    table: [["1", "5"], ["4+K", "2"], ["(18+5K)/(4+K)", "0"], ["2", "0"]],
  },
  {
    title: "Ruptura de segundo orden", g: "1/s", h: "1/(s+6)",
    poles: [-6, 0], zeros: [], derivative: "2s+6",
    breaks: [[-3, 9]], candidates: "En s=−3 los polos coinciden y K=9.",
    polynomial: "s^2+6s+K", table: [["1", "K"], ["6", "0"], ["K", "0"]],
  },
  {
    title: "Dos rupturas y tabla de orden cuatro", g: "1/(s(s+1))", h: "1/((s+2)(s+3))",
    poles: [-3, -2, -1, 0], zeros: [], derivative: "4s^3+18s^2+22s+6",
    breaks: [[(-3-Math.sqrt(5))/2, 1], [(-3+Math.sqrt(5))/2, 1]],
    candidates: "El tercer candidato s=−1,5 queda fuera de los segmentos reales y da K negativo.",
    polynomial: "s^4+6s^3+11s^2+6s+K",
    table: [["1", "11", "K"], ["6", "6", "0"], ["10", "K", "0"], ["6-3K/5", "0", "0"], ["K", "0", "0"]],
    critical: { gain: 10, omega: 1, auxiliary: "10s^2+10",
      why: "En K=10 la fila s¹ es nula. La fila s² da el polinomio auxiliar." },
  },
  {
    title: "Centroide positivo", g: "(s+4)/s", h: "1/((s+1)(s+2))",
    poles: [-2, -1, 0], zeros: [-4], derivative: "2s^3+15s^2+24s+8",
    breaks: [[-0.45473974466489786, 0.10807376185569766]], candidates: "Los otros candidatos reales dan K negativo.",
    polynomial: "s^3+3s^2+(2+K)s+4K",
    table: [["1", "2+K"], ["3", "4K"], ["(6-K)/3", "0"], ["4K", "0"]],
    critical: { gain: 6, omega: Math.sqrt(8), auxiliary: "3s^2+24",
      why: "La fila s¹ se anula cuando 6−K=0." },
  },
];

function partialLocus(model: PartialLocus, index: number): LocusExercise {
  const id = `P4.${index + 1}`;
  const { poles, zeros, critical } = model;
  const order = poles.length;
  const layers: LocusStage[] = [];
  const items: Question[] = [];
  function add(question: Question, kind?: LocusStage["kind"], values: number[] = []) {
    if (kind) layers.push({ stage: items.length, kind, values });
    items.push(question);
  }
  for (const [kind, roots, label] of [["pole", poles, "polo"], ["zero", zeros, "cero"]] as const) {
    const distinct = [...new Set(roots)];
    if (!roots.length) {
      add(numeric("Ceros", "¿Cuántos ceros finitos tiene L(s)?", 0,
        "Contá las raíces del numerador.", "El numerador es constante."));
    }
    distinct.forEach((root, i) => {
      const multiplicity = roots.filter((value) => value === root).length;
      add(numeric("Extremos", `Ingresá el ${label} ${i + 1} de izquierda a derecha.`, root,
        `Igualá a cero cada factor del ${kind === "pole" ? "denominador" : "numerador"}.`,
        "La raíz fija una posición sobre el eje real.", undefined, 0.01),
        multiplicity === 1 ? kind : undefined, [root]);
      if (multiplicity > 1) {
        add(numeric("Multiplicidad", `¿Qué multiplicidad tiene el ${label} que acabás de ingresar?`,
          multiplicity, "Contá cuántas veces aparece su factor.", `Hay ${multiplicity} ramas en la misma posición.`),
          kind, [root, multiplicity]);
      }
    });
  }
  const endpoints = [-Infinity, ...new Set([...poles, ...zeros].sort((a, b) => a - b)), Infinity];
  const printed = (value: number) => ({ Infinity: "+∞", "-Infinity": "−∞" })[String(value)] ?? String(value).replace("-", "−");
  endpoints.slice(0, -1).forEach((left, i) => {
    const right = endpoints[i + 1];
    const count = [...poles, ...zeros].filter((root) => root >= right).length;
    const belongs = count % 2 === 1;
    add(choose("Segmentos reales", `¿Pertenece al LGR el intervalo (${printed(left)}, ${printed(right)})?`,
      ["Sí", "No"], belongs ? 0 : 1, "Contá los polos y ceros a la derecha con su multiplicidad.",
      `Hay ${count} a la derecha. Un conteo impar ubica el intervalo en el LGR.`),
      belongs ? "segment" : undefined, [left, right]);
  });
  const excess = order - zeros.length;
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const center = (sum(poles) - sum(zeros)) / excess;
  add(numeric("Centroide", "Calculá el centroide de las asíntotas.", center,
    "Restá la suma de ceros a la de polos y dividí por la diferencia de cantidades.",
    "Las asíntotas cortan el eje real en ese centroide.", undefined, 0.01), "center", [center]);
  const angles = Array.from({ length: excess }, (_, i) => 180 * (2 * i + 1) / excess);
  angles.forEach((angle, i) => add(numeric("Asíntotas", `Calculá el ángulo de la asíntota ${i + 1} en orden creciente.`,
    angle, "Usá (2q+1)·180°/(n−m), comenzando con q=0.",
    "Medí el ángulo desde el semieje real positivo.", "°", 0.5), "angles", [center, angle]));
  add(expression("Derivada", "Escribí el numerador de d(D/N)/ds, después de simplificar.",
    model.derivative, "Derivá D/N. Para un cociente usá D′N−DN′ y simplificá factores comunes.",
    "Sus raíces son candidatos. Comprobá pertenencia al lugar y K positivo."));
  if (!model.breaks.length) {
    add(choose("Ruptura", "¿Hay ruptura real interior para K>0?", ["Ninguna", "Una", "Dos"], 0,
      "Un candidato debe pertenecer a un segmento y dar K positivo.", model.candidates));
  }
  model.breaks.forEach(([position, gain], i) => {
    add({ ...numeric("Ruptura", `Ingresá la ruptura real ${i + 1} de izquierda a derecha.`,
      position, "Usá una raíz de la derivada dentro de un segmento real con K>0.",
      model.candidates, undefined, 0.025), pick: "real" }, "break", [position]);
    add(numeric("Ganancia de ruptura", "¿Qué K corresponde a esa ruptura?", gain,
      "Evaluá K=−D/N en la posición elegida.", "En esa ganancia coinciden dos ramas.", undefined, 0.005));
  });
  add(choose("Ramas", "¿Qué ecuación determina los polos para cada K?",
    ["D+KN=0", "D−KN=0", "N=0"], 0, "Reordená 1+KN/D=0.",
    "Las raíces recorren las ramas al variar K."), "branches");

  const routhItems: Question[] = [expression("Ecuación característica", "Escribí D+KN como polinomio en s y K.",
    model.polynomial, "Multiplicá 1+KN/D=0 por D.", "La tabla de Routh usa los coeficientes de ese polinomio.")];
  const cells: RouthLesson["cells"] = [];
  model.table.forEach((row, rowIndex) => row.forEach((label, col) => {
    const stage = routhItems.length;
    cells.push({ row: rowIndex, col, label, stage });
    routhItems.push(expression("Tabla de Routh", `Completá la fila s^${order - rowIndex}, columna ${col + 1}.`, label,
      rowIndex < 2 ? "Ubicá los coeficientes de potencias alternadas y completá con cero."
        : "Calculá el determinante con las dos filas anteriores y dividí por el pivote.",
      rowIndex < 2 ? "Las primeras dos filas separan las potencias alternadas."
        : "El pivote de la fila precedente normaliza la operación."));
  }));
  const interval = critical ? `0 < K < ${critical.gain}` : "Todo K > 0";
  routhItems.push(choose("Estabilidad", "¿Para qué K>0 es estrictamente estable el cierre?",
    [interval, critical ? "Todo K > 0" : "Solo 0 < K < 1", "Ningún K > 0"], 0,
    "Exigí que toda la primera columna sea positiva.",
    critical?.why ?? "Con K positivo todos los términos de la primera columna son estrictamente positivos."));
  if (critical) {
    routhItems.push(numeric("Ganancia crítica", "Calculá K para que se anule la fila s¹.",
      critical.gain, "Igualá a cero el término de la primera columna de esa fila.", critical.why,
      undefined, 0.005));
    routhItems.push(expression("Fila auxiliar", `En K=${critical.gain}, escribí el polinomio de la fila sobre la fila nula.`,
      critical.auxiliary, "Evaluá la fila s² en la ganancia crítica y conservá sus potencias.", critical.why));
    layers.push({ stage: items.length + routhItems.length, kind: "crossing", values: [critical.omega] });
    routhItems.push(numeric("Cruce imaginario", "Calculá la frecuencia positiva ωc del par ±jωc.", critical.omega,
      "Igualá a cero el polinomio auxiliar y despejá s².", "La frecuencia es la magnitud de la parte imaginaria.",
      "rad/s", 0.01));
  }
  return {
    id, page: index === 4 ? 7 : 6, topic: "Routh y LGR", partial: partial(model.title),
    formula: `G(s) = ${model.g}, H(s) = ${model.h}`,
    prompt: "Para K>0, trazá el lugar de las raíces y determiná la estabilidad mediante la tabla de Routh.",
    l0: `(${model.g})*(${model.h})`, layers,
    steps: questions(id, [...items, ...routhItems]),
    routh: { steps: questions(id + ".R", routhItems), cells },
  };
}

export const locusExercises = [...models.map(locus), ...partialModels.map(partialLocus)];
// Coefficients in ascending powers, including multiplicities.
function polynomial(roots: number[]) {
  return roots.reduce(
    (coefficients, root) => {
      const next = Array(coefficients.length + 1).fill(0) as number[];
      coefficients.forEach((v, i) => {
        next[i] -= root * v;
        next[i + 1] += v;
      });
      return next;
    },
    [1],
  );
}

function polyText(coefficients: number[]) {
  return (
    coefficients
      .map((c, i) =>
        !c
          ? ""
          : (c < 0 ? "-" : "+") +
            (i && Math.abs(c) === 1 ? "" : Math.abs(c)) +
            (i === 0 ? "" : i === 1 ? "s" : "s^" + i),
      )
      .reverse()
      .join("")
      .replace(/^\+/, "") || "0"
  );
}

function guidedLocus(
  base: LocusExercise,
  poles: number[],
  zeros: number[],
  derivative: string,
  criticalGain?: number,
) {
  const d = polynomial(poles),
    n = polynomial(zeros);
  const differentiate = (coeffs: number[]) =>
    polyText(coeffs.slice(1).map((v, i) => v * (i + 1)));
  const dp = differentiate(d),
    np = differentiate(n);
  const D = polyText(d),
    N = polyText(n);
  const items: Question[] = [];
  const stageMap: number[] = [];
  const algebra = (
    concept: string,
    prompt: string,
    values: string[],
    hint: string,
  ) => ({
    ...choose(concept, prompt, values, 0, hint, hint),
    expression: true,
  });
  const viaRouth = base.steps.length - base.routh.steps.length;
  let tableStart = 0;
  function derivativeSteps() {
    items.push(
      algebra(
        "Despeje de K",
        "Si D(s)+K·N(s)=0, ¿qué expresión da K(s)?",
        [
          "-(" + D + ")/(" + N + ")",
          "(" + D + ")/(" + N + ")",
          "-(" + N + ")/(" + D + ")",
        ],
        "Pasá D al otro lado y dividí por N.",
      ),
    );
    items.push(
      algebra(
        "Derivar D",
        "Con D(s) = " + D + ", elegí su derivada.",
        [dp, D, "(" + dp + ")+1"],
        "Derivá término por término: el exponente baja a multiplicar y disminuye en uno.",
      ),
    );
    items.push(
      algebra(
        "Derivar N",
        "Con N(s) = " + N + ", ¿cuánto vale N′(s)?",
        [np, N, np === "0" ? "-1" : "-(" + np + ")"],
        "La derivada de una constante es cero. Para s elevado a n usá n por s elevado a n−1.",
      ),
    );
    items.push(
      choose(
        "Condición de ruptura",
        "Con N distinto de cero, ¿qué ecuación hay que resolver?",
        ["D′N − DN′ = 0", "D′N + DN′ = 1", "D + KN = 0 para K = 0"],
        0,
        "Aplicá la regla del cociente a K=−D/N.",
        "El signo global y el denominador N² no cambian las raíces del numerador donde N es distinto de cero.",
      ),
    );
    items.push(
      algebra(
        "Polinomio de ruptura",
        "Elegí el polinomio de D′N−DN′ que se iguala a cero, cancelando factores comunes con N².",
        [derivative, "(" + derivative + ")+1", "(" + derivative + ")+s"],
        "Sustituí las derivadas que elegiste y distribuí los productos.",
      ),
    );
  }
  function gainAt(position: number) {
    const at = (roots: number[]) =>
      roots.reduce((product, root) => product * (position - root), 1);
    const gain = -at(poles) / at(zeros);
    const rounded = (v: number) =>
      String(Number(v.toFixed(4))).replace(".", ",");
    items.push(
      choose(
        "Evaluar la ganancia",
        "Con la ruptura en s ≈ " +
          rounded(position) +
          ", ¿dónde reemplazás ese valor?",
        [
          "En K(s) = −D(s)/N(s)",
          "En la derivada dK/ds",
          "En la primera columna de Routh",
        ],
        0,
        "Ya encontraste la posición. Recuperá la ganancia con la ecuación característica.",
        "Evaluá D y N en el mismo punto antes de dividir.",
      ),
    );
    items.push(
      choose(
        "Ganancia de ruptura",
        "En ese punto, D ≈ " +
          rounded(at(poles)) +
          " y N ≈ " +
          rounded(at(zeros)) +
          ". ¿Qué K corresponde a esa ruptura, aproximadamente?",
        [rounded(gain), rounded(-gain), rounded(2 * gain)],
        0,
        "Calculá −D/N con los valores indicados.",
        "Con esta K dos ramas coinciden en el eje real.",
      ),
    );
  }
  base.steps.forEach((step, stage) => {
    if (stage === viaRouth) {
      tableStart = items.length;
      items.push(
        choose(
          "Conectar LGR y Routh",
          "¿Qué polinomio usa Routh para estudiar cómo cambia la estabilidad con K?",
          ["D(s) + K·N(s)", "D′(s)·N(s) − D(s)·N′(s)", "D(s) sin K"],
          0,
          "Partí de la ecuación del lazo cerrado.",
          "Sus raíces son los polos del LGR. La primera columna de Routh permite estudiar en qué semiplano están.",
        ),
      );
    }
    if (
      step.concept === "Derivada" ||
      (step.concept === "Ruptura" && step.expression)
    ) {
      derivativeSteps();
    } else if (
      step.concept === "Ruptura" &&
      step.prompt.includes("operación")
    ) {
      // The guided quotient-rule step already establishes the stationary condition.
    } else if (
      step.pick === "real" &&
      step.concept === "Ruptura" &&
      typeof step.answer === "object"
    ) {
      const pos = step.answer.value;
      const value = Number(pos.toFixed(4)).toString().replace(".", ",");
      const which = step.prompt.includes("izquierda")
        ? step.prompt.match(/ruptura real (\d+)/)?.[1]
        : undefined;
      items.push(
        choose(
          "Ruptura",
          "¿Cuál de estas posiciones aproxima la ruptura real válida" +
            (which ? " número " + which + " de izquierda a derecha" : "") +
            "?",
          [
            value,
            String(poles[0]),
            String(Math.abs(Number(pos.toFixed(4)))).replace(".", ","),
          ],
          0,
          step.hint,
          step.explanation,
        ),
      );
      items.push(step);
      stageMap[stage] = items.length - 1;
      gainAt(pos);
      return;
    } else if (step.concept === "Ganancia crítica") {
      // Solved before selecting the stability interval below.
    } else if (step.concept === "Ganancia de ruptura") {
      // The substitution and its numerical result follow each candidate above.
    } else {
      const pivotCell = base.routh.cells.find(
        (cell) =>
          cell.stage === stage - viaRouth && cell.row === 2 && cell.col === 0,
      );
      if (pivotCell) {
        items.push(
          choose(
            "Armar el pivote",
            "Si las primeras filas son [a, b, …] y [c, d, …], ¿cómo calculás la primera celda de la tercera fila?",
            ["(c·b − a·d)/c", "(a·d − c·b)/c", "(c·b − a·d)/a"],
            0,
            "El divisor es el primer elemento de la fila inmediatamente superior.",
            "Usá ese orden para completar la próxima celda de la tabla.",
          ),
        );
      }
      if (
        step.concept === "Estabilidad" &&
        step.prompt.includes("estrictamente estable")
      ) {
        const firstColumn = base.routh.cells
          .filter((cell) => cell.col === 0)
          .map((cell) => cell.label)
          .join(", ");
        if (criticalGain !== undefined) {
          const cell = base.routh.cells.find(
            (c) => c.row === poles.length - 1 && c.col === 0,
          )!;
          items.push(
            choose(
              "Frontera de estabilidad",
              "La fila s¹ empieza con " +
                cell.label +
                ". ¿Qué condición buscás para el cruce imaginario?",
              [
                "Anular esa entrada con K positivo",
                "Anular dK/ds",
                "Hacer que el primer coeficiente sea negativo",
              ],
              0,
              "En estos ejercicios la otra entrada de s¹ ya es cero.",
              "Al quedar la fila nula, la fila s² proporciona el polinomio auxiliar.",
            ),
          );
          items.push(
            numeric(
              "Ganancia crítica",
              "Igualá " + cell.label + " a cero. ¿Qué K positivo obtenés?",
              criticalGain,
              "Multiplicá por el denominador y despejá K.",
              "Esta es la ganancia del cruce imaginario.",
            ),
          );
        }
        items.push(
          choose(
            "Leer Routh",
            "Primera columna: " +
              firstColumn +
              ". Con coeficiente líder positivo, ¿qué exigís para estabilidad estricta?",
            [
              "Todas las entradas positivas",
              "Solo la última positiva",
              "Una fila completa de ceros",
            ],
            0,
            "Los cambios de signo cuentan polos con parte real positiva.",
            "Para estos ejercicios, el intervalo abierto se obtiene imponiendo positividad simultánea.",
          ),
        );
      }
      if (pivotCell && typeof step.answer === "string") {
        const [a, b, c, d] = [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ].map(
          ([r, col]) =>
            base.routh.cells.find((cell) => cell.row === r && cell.col === col)!
              .label,
        );
        items.push(
          algebra(
            "Tabla de Routh",
            step.prompt +
              " Usá [a, b] = [" +
              a +
              ", " +
              b +
              "] y [c, d] = [" +
              c +
              ", " +
              d +
              "].",
            [step.answer, "-(" + step.answer + ")", "(" + step.answer + ")+1"],
            step.hint,
          ),
        );
      } else items.push(step);
    }
    stageMap[stage] = items.length - 1;
  });
  const steps = questions(base.id + "-guiado", items);
  return {
    ...base,
    steps,
    layers: base.layers.map((layer) => ({
      ...layer,
      stage: stageMap[layer.stage],
    })),
    routh: {
      steps: steps.slice(tableStart),
      cells: base.routh.cells.map((cell) => ({
        ...cell,
        stage: stageMap[viaRouth + cell.stage] - tableStart,
      })),
    },
  };
}

export const guidedLocusExercises = locusExercises.map((exercise, i) => {
  const m = models[i];
  if (m)
    return guidedLocus(
      exercise,
      m.poles,
      m.zero === undefined ? [] : [m.zero],
      m.derivative,
      m.zero === undefined
        ? coefficients(m.poles).a2 * coefficients(m.poles).b0
        : undefined,
    );
  const p = partialModels[i - models.length];
  return guidedLocus(
    exercise,
    p.poles,
    p.zeros,
    p.derivative,
    p.critical?.gain,
  );
});
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
