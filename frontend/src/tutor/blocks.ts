import { reductionLesson } from "./blockReductions";
import {
  choose,
  expression,
  numeric,
  partial,
  questions,
  type Exercise,
  type Question,
} from "./exercise";

export type Node = [id: string, column: number, row: number, label?: string];
export type Edge = [
  from: string,
  to: string,
  sign?: "+" | "−",
  via?: [number, number][],
];
export type Diagram = { nodes: Node[]; edges: Edge[] };
type Snapshot = { stage: number; title: string; diagram: Diagram };
export type BlockExercise = Exercise & {
  diagram: Diagram;
  transformed?: Snapshot[];
  alternate?: {
    label: string;
    steps: Exercise["steps"];
    transformed: Snapshot[];
  };
};

const edge = (
  from: string,
  to: string,
  sign?: Edge[2],
  ...via: NonNullable<Edge[3]>
): Edge => [from, to, sign, via];
const chain = (...ids: string[]): Edge[] =>
  ids.slice(1).map((id, i) => {
    const sign = id.startsWith("+")
      ? "+"
      : id.startsWith("-")
        ? "−"
        : undefined;
    return edge(ids[i].replace(/^[+-]/, ""), sign ? id.slice(1) : id, sign);
  });
const wire = (nodes: Node[], edges: Edge[]): Diagram => ({ nodes, edges });
const eq = (
  concept: string,
  prompt: string,
  answer: string,
  hint: string,
  why: string,
) => expression(concept, prompt, answer, hint, why);
const result = (answer: string, target = "C/R") =>
  eq(
    "Equivalente",
    "Escribí " + target + " como una expresión única.",
    answer,
    "Despejá la salida y dividí por la entrada activa.",
    "La misma expresión sale al eliminar las señales internas.",
  );
const select = (
  prompt: string,
  options: string[],
  answer: number,
  hint: string,
  why: string,
): Question => ({
  ...choose("Seleccionar en el esquema", prompt, options, answer, hint, why),
  selectNode: true,
});
const sign = (prompt: string, positive: boolean, why: string) =>
  choose(
    "Signo de retorno",
    prompt,
    ["Positivo", "Negativo"],
    positive ? 0 : 1,
    "Seguí la flecha hasta el signo de entrada del sumador.",
    why,
  );

function reduced(label: string, input = "R", output = "C") {
  return wire(
    [
      [input, 0, 0],
      ["equivalente", 2, 0, label],
      [output, 4, 0],
    ],
    chain(input, "equivalente", output),
  );
}
function lesson(
  id: string,
  page: string,
  diagram: Diagram,
  items: Question[],
  extra: Partial<BlockExercise> = {},
): BlockExercise {
  return {
    id,
    page,
    diagram,
    topic: "Álgebra de bloques",
    prompt: "Reconstruí las señales y hallá la transferencia equivalente.",
    steps: questions(id, items),
    ...extra,
  };
}
const feedback = (forward: string, feedback: string, output = "C") =>
  wire(
    [
      ["R", 0, 0],
      ["Σ1", 1, 0],
      [forward, 2, 0],
      [".t", 3, 0],
      [output, 4, 0],
      [feedback, 2, 1],
    ],
    [
      ...chain("R", "+Σ1", forward, ".t", output),
      edge(".t", feedback, undefined, [3, 1]),
      edge(feedback, "Σ1", "−", [1, 1]),
    ],
  );
function reducedFeedback(labels: string[], sign: "+" | "−" = "−"): Diagram {
  const blocks: Node[] = labels.map((label, i) => [
    "Q" + (i + 1),
    2 + i,
    0,
    label,
  ]);
  const takeoff = 2 + blocks.length;
  return wire(
    [
      ["R", 0, 0],
      ["Σ1", 1, 0],
      ...blocks,
      [".c", takeoff, 0],
      ["C", takeoff + 1, 0],
    ],
    [
      ...chain("R", "+Σ1", ...blocks.map(([id]) => id), ".c", "C"),
      edge(".c", "Σ1", sign, [takeoff, 1], [1, 1]),
    ],
  );
}
const d7 = wire(
  [
    ["R", 0, 0],
    ["Σ1", 1, 0],
    ["Σ2", 2, 0],
    ["G1", 3, 0],
    ["Σ3", 4, 0],
    ["G2", 5, 0],
    [".x", 6, 0],
    ["G3", 7, 0],
    [".y", 8, 0],
    ["C", 9, 0],
    ["H1", 4, 1],
    ["H2", 6, -1],
  ],
  [
    ...chain("R", "+Σ1", "+Σ2", "G1", "+Σ3", "G2", ".x", "G3", ".y", "C"),
    edge(".x", "H1", undefined, [6, 1]),
    edge("H1", "Σ2", "+", [2, 1]),
    edge(".y", "H2", undefined, [8, -1]),
    edge("H2", "Σ3", "−", [4, -1]),
    edge(".y", "Σ1", "−", [8, 2], [1, 2]),
  ],
);
const d7Moved = wire(
  [
    ["R", 0, 0],
    ["Σ1", 1, 0],
    ["Σ2", 2, 0],
    ["Σ3", 3, 0],
    ["G1", 4, 0],
    ["G2", 5, 0],
    [".x", 6, 0],
    ["G3", 7, 0],
    [".y", 8, 0],
    ["C", 9, 0],
    ["H1", 4, 1],
    ["H2", 6, -1, "H2/G1"],
  ],
  [
    ...chain("R", "+Σ1", "+Σ2", "+Σ3", "G1", "G2", ".x", "G3", ".y", "C"),
    edge(".x", "H1", undefined, [6, 1]),
    edge("H1", "Σ2", "+", [2, 1]),
    edge(".y", "H2", undefined, [8, -1]),
    edge("H2", "Σ3", "−", [3, -1]),
    edge(".y", "Σ1", "−", [8, 2], [1, 2]),
  ],
);
const d11 = (moved: boolean) =>
  wire(
    [
      ["R", 0, 0],
      ["Σ1", 1, 0],
      ["Σ2", 2, 0],
      ["G1", 3, 0],
      ["Σ3", 4, 0],
      ["G4", 5, 0],
      [".x", 6, 0],
      ["G3", 7, 0],
      [".y", 8, 0],
      ["C", 9, 0],
      ["K1", 6, -1],
      ["K2", 4, 1, moved ? "K2/G3" : "K2"],
      ["G2", 4, 2],
    ],
    [
      ...chain("R", "+Σ1", "+Σ2", "G1", "+Σ3", "G4", ".x", "G3", ".y", "C"),
      edge(".y", "K1", undefined, [8, -1]),
      edge("K1", "Σ3", "−", [4, -1]),
      edge(moved ? ".y" : ".x", "K2", undefined, [moved ? 8 : 6, 1]),
      edge("K2", "Σ2", "−", [2, 1]),
      edge(".y", "G2", undefined, [8, 2]),
      edge("G2", "Σ1", "−", [1, 2]),
    ],
  );
const d12 = wire(
  [
    ["R", 0, 0],
    ["Σ1", 1, 0],
    ["G1", 2, 0],
    ["Σ2", 3, 0],
    ["G2", 4, 0],
    [".c", 5, 0],
    ["C", 6, 0],
  ],
  [
    ...chain("R", "+Σ1", "G1", "+Σ2", "G2", ".c", "C"),
    edge(".c", "Σ2", "+", [5, -1], [3, -1]),
    edge(".c", "Σ1", "−", [5, 1], [1, 1]),
  ],
);
const d12Final = "G1*G2/(1-G2+G1*G2)";

const originalBlockExercises = [
  lesson(
    "D1",
    "2 · penúltimo",
    wire(
      [
        ["U", 0, 0],
        [".u", 1, 0],
        ["G1", 2, 0],
        ["G2", 2, 1],
        ["Σ1", 3, 0],
        ["Y", 4, 0],
      ],
      [
        ...chain("U", ".u", "G1", "+Σ1", "Y"),
        edge(".u", "G2", undefined, [1, 1]),
        edge("G2", "Σ1", "−", [3, 1]),
      ],
    ),
    [
      select(
        "Tocá el bloque cuya salida entra con signo menos.",
        ["G1", "G2"],
        1,
        "Seguí la rama inferior.",
        "G₂ produce la señal N del manuscrito.",
      ),
      eq(
        "Señales",
        "Escribí Y en función de M y N.",
        "M-N",
        "Leé los signos en Σ1.",
        "M entra con + y N entra con −.",
      ),
      result("G1-G2", "Y/U"),
    ],
  ),
  lesson(
    "D2",
    "2 · último",
    feedback("G1", "G2", "Y"),
    [
      select(
        "Tocá el bloque del retorno.",
        ["G1", "G2"],
        1,
        "La flecha sale de Y y vuelve al sumador.",
        "La medida del retorno es YG₂.",
      ),
      eq(
        "Señales",
        "Usá r para la entrada y escribí M, salida del sumador, en función de r e y.",
        "r-yG2",
        "Seguí los dos signos.",
        "Del sumador sale la referencia menos el retorno.",
      ),
      result("G1/(1+G1*G2)", "Y/U"),
    ],
    {
      diagram: wire(
        [
          ["U", 0, 0],
          ["Σ1", 1, 0],
          ["G1", 2, 0],
          [".y", 3, 0],
          ["Y", 4, 0],
          ["G2", 2, 1],
        ],
        [
          ...chain("U", "+Σ1", "G1", ".y", "Y"),
          edge(".y", "G2", undefined, [3, 1]),
          edge("G2", "Σ1", "−", [1, 1]),
        ],
      ),
    },
  ),
  lesson(
    "D3",
    "3 · arriba",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        ["G1", 2, 0],
        ["G2", 3, 0],
        ["G3", 4, 0],
        [".y", 5, 0],
        ["Y", 6, 0],
        ["H", 3, 1],
      ],
      [
        ...chain("R", "+Σ1", "G1", "G2", "G3", ".y", "Y"),
        edge(".y", "H", undefined, [5, 1]),
        edge("H", "Σ1", "−", [1, 1]),
      ],
    ),
    [
      eq(
        "Serie",
        "¿Qué bloque equivalente va de Σ1 a Y?",
        "G1*G2*G3",
        "Multiplicá las ganancias recorridas.",
        "Cada salida alimenta al siguiente bloque.",
      ),
      eq(
        "Señales",
        "Escribí la salida de Σ1 en función de r e y.",
        "r-yH",
        "Leé las dos entradas.",
        "El retorno H recibe Y.",
      ),
      result("G1*G2*G3/(1+H*G1*G2*G3)", "Y/R"),
    ],
  ),
  lesson(
    "D4",
    "3 · abajo",
    wire(
      [
        ["R", 0, 0],
        [".r", 1, 0],
        ["G1", 2, 0],
        ["Σ1", 3, 0],
        ["G2", 4, 0],
        ["Σ2", 5, 0],
        ["C", 6, 0],
      ],
      [
        ...chain("R", ".r", "G1", "+Σ1", "G2", "+Σ2", "C"),
        edge(".r", "Σ1", "+", [1, 1], [3, 1]),
        edge(".r", "Σ2", "+", [1, 2], [5, 2]),
      ],
    ),
    [
      eq(
        "Señales",
        "Escribí X, salida de Σ1, en función de r.",
        "rG1+r",
        "La referencia entra también por la bifurcación.",
        "Las dos entradas tienen signo positivo.",
      ),
      eq(
        "Señales",
        "Si u es la salida de G₂, escribí C en función de u y r.",
        "u+r",
        "La rama inferior retoma R.",
        "Σ2 suma las dos entradas.",
      ),
      result("G1*G2+G2+1"),
    ],
  ),
  lesson(
    "D5",
    "4 · arriba",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        [".e", 2, 0],
        ["G1", 3, 0],
        ["G2", 3, -1],
        ["Σ2", 4, 0],
        [".c", 5, 0],
        ["C", 6, 0],
        ["G3", 4, 1],
        ["G4", 4, 2],
        ["Σ3", 2, 1],
      ],
      [
        ...chain("R", "+Σ1", ".e", "G1", "+Σ2", ".c", "C"),
        edge(".e", "G2", undefined, [2, -1]),
        edge("G2", "Σ2", "+", [4, -1]),
        edge(".c", "G3", undefined, [5, 1]),
        edge(".c", "G4", undefined, [5, 2]),
        edge("G3", "Σ3", "+"),
        edge("G4", "Σ3", "−", [2, 2]),
        edge("Σ3", "Σ1", "+", [1, 1]),
      ],
    ),
    [
      eq(
        "Señal auxiliar",
        "Escribí U, salida de Σ3, en función de c.",
        "c*(G3-G4)",
        "Las dos ramas toman C.",
        "G₄ entra con signo negativo.",
      ),
      eq(
        "Paralelo",
        "¿Qué equivale a las dos ramas de avance?",
        "G1+G2",
        "Siguen la misma señal y se suman.",
        "La entrada a ambas ramas es r+u.",
      ),
      result("(G1+G2)/(1-(G1+G2)*(G3-G4))"),
    ],
  ),
  lesson(
    "D6",
    "4 · abajo",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        [".e", 2, 0],
        ["G", 3, 0],
        [".m", 4, 0],
        ["Σ2", 5, 0],
        ["C", 6, 0],
        ["H1", 3, 1],
        ["H2", 3, -1],
      ],
      [
        ...chain("R", "+Σ1", ".e", "G", ".m", "+Σ2", "C"),
        edge(".e", "H2", undefined, [2, -1]),
        edge("H2", "Σ2", "+", [5, -1]),
        edge(".m", "H1", undefined, [4, 1]),
        edge("H1", "Σ1", "−", [1, 1]),
      ],
    ),
    [
      select(
        "¿Qué bloque recibe la señal M, antes de Σ2?",
        ["H1", "H2", "G"],
        0,
        "Seguí la bifurcación que sale de G.",
        "H₁ toma M. H₂ toma la salida de Σ1.",
      ),
      eq(
        "Señales",
        "Escribí M/R.",
        "G/(1+G*H1)",
        "Cerrá el lazo de M.",
        "El retorno no depende de la salida C.",
      ),
      result("(G+H2)/(1+G*H1)"),
    ],
  ),
  lesson(
    "D7",
    "5–6",
    d7,
    [
      select(
        "Tocá el bloque a través del cual trasladás Σ3 hacia la izquierda.",
        ["G1", "G2", "G3"],
        0,
        "Σ3 está después de ese bloque.",
        "El traslado debe preservar la entrada de G₂.",
      ),
      eq(
        "Traslado de sumador",
        "Escribí el nuevo bloque de retorno H₂ referido antes de G₁.",
        "H2/G1",
        "La contribución debe ser la misma después de G₁.",
        "La nueva rama multiplicada por G₁ reproduce CH₂.",
      ),
      sign(
        "¿Qué signo tiene el retorno H₁ en Σ2?",
        true,
        "El retorno desde la salida de G₂ suma.",
      ),
      eq(
        "Reducir lazo interior",
        "Escribí el equivalente de G₁G₂ con H₁.",
        "G1*G2/(1-G1*G2*H1)",
        "El signo del retorno cambia el denominador.",
        "El factor de H₁ se aplica antes de G₃.",
      ),
      eq(
        "Reducir el segundo lazo",
        "Cerrá H₂/G₁ con G₃ en serie. ¿Cuál es el bloque X antes del retorno unitario?",
        "G1*G2*G3/(1-G1*G2*H1+H2*G2*G3)",
        "Conservá el retorno H₁ y agregá la realimentación negativa de H₂/G₁.",
        "El producto con el retorno cancela G₁ solo en el término de H₂.",
      ),
      result("G1*G2*G3/(1-G1*G2*H1+H2*G2*G3+G1*G2*G3)"),
    ],
    {
      transformed: [
        { stage: 1, title: "Σ3 antes de G₁", diagram: d7Moved },
        {
          stage: 4,
          title: "Bloque X con retorno unitario",
          diagram: reducedFeedback(["X"]),
        },
      ],
    },
  ),
  lesson(
    "D8",
    "7",
    wire(
      [
        ["U", 0, 0],
        ["Σ1", 1, 0],
        ["F", 2, 0, "5/(s+2)"],
        [".x", 3, 0],
        ["I", 4, 0, "1/s"],
        [".y", 5, 0],
        ["Y", 6, 0],
        ["K", 3, 1, "4"],
        ["Σ2", 3, 2],
      ],
      [
        ...chain("U", "+Σ1", "F", ".x", "I", ".y", "Y"),
        edge(".x", "K"),
        edge("K", "Σ2", "+"),
        edge(".y", "Σ2", "+", [5, 2]),
        edge("Σ2", "Σ1", "+", [1, 2]),
      ],
    ),
    [
      sign(
        "¿Con qué signo se suma el retorno combinado en Σ1?",
        true,
        "La entrada inferior de Σ1 es positiva.",
      ),
      eq(
        "Traslado de toma",
        "Si llevás la toma de Y antes del integrador, ¿qué factor conserva Y?",
        "1/s",
        "Antes del integrador la señal todavía es X.",
        "Duplicá la acción del integrador en la rama movida.",
      ),
      eq(
        "Retorno equivalente",
        "Escribí el retorno total multiplicado por X, sin incluir X.",
        "4+1/s",
        "Σ2 suma las dos ramas.",
        "El retorno se puede leer desde un único nodo X.",
      ),
      eq(
        "Reducir lazo",
        "Escribí X/U tras cerrar el lazo positivo.",
        "5*s/(s^2-18s-5)",
        "Aplicá F/(1−F·H).",
        "El integrador principal todavía queda en serie.",
      ),
      result("5/(s^2-18s-5)", "Y/U"),
    ],
    {
      transformed: [
        {
          stage: 2,
          title: "Retorno equivalente referido a X",
          diagram: wire(
            [
              ["U", 0, 0],
              ["Σ1", 1, 0],
              ["F", 2, 0, "5/(s+2)"],
              [".x", 3, 0],
              ["I", 4, 0, "1/s"],
              ["Y", 5, 0],
              ["H", 2, 1, "4+1/s"],
            ],
            [
              ...chain("U", "+Σ1", "F", ".x", "I", "Y"),
              edge(".x", "H", undefined, [3, 1]),
              edge("H", "Σ1", "+", [1, 1]),
            ],
          ),
        },
      ],
    },
  ),
  lesson(
    "D9",
    "8 · arriba",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        ["G1", 2, 0],
        ["Σ2", 3, 0],
        ["G2", 4, 0],
        [".c", 5, 0],
        ["C", 6, 0],
        ["D", 3, -1],
        ["H1", 3, 1],
      ],
      [
        ...chain("R", "+Σ1", "G1", "+Σ2", "G2", ".c", "C"),
        edge("D", "Σ2", "+"),
        edge(".c", "H1", undefined, [5, 1]),
        edge("H1", "Σ1", "−", [1, 1]),
      ],
    ),
    [
      select(
        "¿Qué entrada conservás activa al calcular C/R?",
        ["R", "D"],
        0,
        "Anulá la perturbación.",
        "Para C/R se impone D=0.",
      ),
      eq(
        "Señales",
        "Escribí la entrada de G₂ en función de r, c y d.",
        "G1*(r-H1*c)+d",
        "D entra después de G₁.",
        "Seguí los dos sumadores.",
      ),
      result("G1*G2/(1+G1*G2*H1)"),
      select(
        "¿Qué entrada conservás activa al calcular C/D?",
        ["R", "D"],
        1,
        "Anulá la referencia.",
        "Para C/D se impone R=0.",
      ),
      result("G2/(1+G1*G2*H1)", "C/D"),
    ],
  ),
  lesson(
    "D10",
    "8–9 y 58",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        ["Σ2", 2, 0],
        ["K1", 3, 0],
        [".x", 4, 0],
        ["Σ3", 5, 0],
        ["K2", 6, 0],
        [".y", 7, 0],
        ["K3", 8, 0],
        [".c", 9, 0],
        ["C", 10, 0],
        ["H1", 3, 1],
      ],
      [
        ...chain(
          "R",
          "+Σ1",
          "+Σ2",
          "K1",
          ".x",
          "+Σ3",
          "K2",
          ".y",
          "K3",
          ".c",
          "C",
        ),
        edge(".x", "H1", undefined, [4, 1]),
        edge("H1", "Σ2", "−", [2, 1]),
        edge(".y", "Σ3", "+", [7, -1], [5, -1]),
        edge(".c", "Σ1", "−", [9, 2], [1, 2]),
      ],
    ),
    [
      sign(
        "¿Qué signo tiene el lazo de H₁?",
        false,
        "H₁ vuelve a la entrada negativa de Σ2.",
      ),
      eq(
        "Primer lazo",
        "Reducí K₁ con el retorno H₁.",
        "K1/(1+K1*H1)",
        "El retorno de H₁ es negativo.",
        "Aplicá cierre local.",
      ),
      sign(
        "¿Qué signo tiene el retorno desde la salida de K₂?",
        true,
        "La entrada superior de Σ3 es positiva.",
      ),
      eq(
        "Segundo lazo",
        "Reducí K₂ con su retorno unitario.",
        "K2/(1-K2)",
        "El retorno de K₂ es positivo.",
        "El denominador cambia de signo respecto del primer lazo.",
      ),
      sign(
        "¿Con qué signo vuelve C a Σ1?",
        false,
        "El diagrama y el repaso de p. 58 muestran signo negativo.",
      ),
      result("K1*K2*K3/((1+K1*H1)*(1-K2)+K1*K2*K3)"),
    ],
    {
      note: "La p. 9 escribe 1−GH al cerrar el retorno exterior, aunque el sumador es negativo. Se sigue el dibujo y la resolución de p. 58, con 1+GH.",
      transformed: [
        {
          stage: 3,
          title: "Lazos internos reducidos",
          diagram: reducedFeedback(["K1/(1+K1·H1)", "K2/(1−K2)", "K3"]),
        },
      ],
    },
  ),
  lesson(
    "D11",
    "10–11 y 59–60",
    d11(false),
    [
      select(
        "¿A través de qué bloque se mueve la toma de K₂ hacia C?",
        ["G1", "G2", "G3", "G4"],
        2,
        "La toma original está entre G₄ y G₃ en el repaso.",
        "La p. 10 ya dibuja la toma desplazada y compensada.",
      ),
      eq(
        "Traslado de toma",
        "Escribí el retorno equivalente referido a C.",
        "K2/G3",
        "C es la señal original multiplicada por G₃.",
        "Para recuperar la señal original dividí C por G₃.",
      ),
      eq(
        "Lazo interior",
        "Reducí la serie G₄G₃ con el retorno K₁.",
        "G4*G3/(1+K1*G4*G3)",
        "El retorno de K₁ es negativo.",
        "La serie conserva el orden de los nodos.",
      ),
      eq(
        "Lazo intermedio",
        "Incluí G₁ y cerrá K₂/G₃.",
        "G1*G3*G4/(1+K1*G3*G4+G1*G4*K2)",
        "En el producto de lazo K₂/G₃ cancela G₃.",
        "La rama K₂ sigue midiendo la salida anterior a G₃.",
      ),
      result("G1*G3*G4/(1+K1*G3*G4+G1*G4*K2+G1*G2*G3*G4)"),
      eq(
        "Sustitución original",
        "Usá G₁=1/(s+4), G₂=1/(s+6), G₃=1/(s²+4), G₄=1/s, K₁=12 y K₂=10. Escribí C/R.",
        "(s+6)/(s*(s+4)*(s+6)*(s^2+4)+12*(s+4)*(s+6)+10*(s+6)*(s^2+4)+1)",
        "Multiplicá por el denominador común de los cuatro términos.",
        "La sustitución conserva el término independiente aportado por G₂.",
      ),
      eq(
        "Datos del repaso",
        "En la p. 59 usá G₃=1/(s²+9), con los demás datos iguales. Escribí C/R.",
        "(s+6)/(s*(s+4)*(s+6)*(s^2+9)+12*(s+4)*(s+6)+10*(s+6)*(s^2+9)+1)",
        "Reemplazá el factor de G₃ donde aparece, conservando K₂.",
        "El repaso cambia la constante del denominador de G₃.",
      ),
    ],
    {
      transformed: [
        { stage: 1, title: "Toma trasladada y compensada", diagram: d11(true) },
      ],
      note: "La p. 10 entrega el esquema trasladado con K₂/G₃. La p. 59 muestra la toma original y usa s²+9 en G₃, frente a s²+4 de pp. 10–11.",
    },
  ),
  lesson(
    "D12",
    "12 y 58",
    d12,
    [
      eq(
        "Ecuaciones de señales",
        "Escribí A, la salida de Σ1, en función de r y c.",
        "r-c",
        "Leé el retorno exterior.",
        "El retorno exterior es unitario negativo.",
      ),
      eq(
        "Ecuaciones de señales",
        "Si b es la salida de G₁, escribí D, la entrada de G₂.",
        "b+c",
        "Σ2 recibe directamente la salida C.",
        "El retorno interior suma.",
      ),
      eq(
        "Ecuaciones de señales",
        "Escribí C en función de r y c en el lado derecho de la ecuación.",
        "G2*(G1*(r-c)+c)",
        "Sustituí A y D antes de despejar.",
        "Esta ecuación conserva ambos signos.",
      ),
      result(d12Final),
    ],
    {
      alternate: {
        label: "Reducción visual",
        transformed: [
          {
            stage: 1,
            title: "Lazo interior reducido",
            diagram: reducedFeedback(["G1", "G2/(1−G2)"]),
          },
          {
            stage: 2,
            title: "Bloques en serie",
            diagram: reducedFeedback(["G1·G2/(1−G2)"]),
          },
        ],
        steps: questions("D12-visual", [
          sign(
            "¿Qué signo tiene el retorno conectado a Σ2?",
            true,
            "El retorno de G₂ suma.",
          ),
          eq(
            "Reducir lazo interior",
            "Escribí el equivalente de G₂ con su retorno unitario.",
            "G2/(1-G2)",
            "El signo positivo produce una resta en el denominador.",
            "El equivalente reemplaza el bloque y su retorno.",
          ),
          eq(
            "Serie",
            "Combiná el equivalente interior con G₁.",
            "G1*G2/(1-G2)",
            "Multiplicá las dos transferencias.",
            "A continuación queda un único retorno negativo.",
          ),
          result(d12Final),
        ]),
      },
    },
  ),
  lesson(
    "D13",
    "13–14",
    wire(
      [
        ["R", 0, 0],
        ["K1", 1, 0],
        ["Σ1", 2, 0],
        ["Σ2", 3, 0],
        ["K2", 4, 0],
        ["Σ3", 5, 0],
        ["I", 6, 0, "1/s"],
        [".c", 7, 0],
        ["C", 8, 0],
        ["N", 5, -1],
        ["K3", 5, 1],
        ["K4", 5, 2],
      ],
      [
        ...chain("R", "K1", "+Σ1", "+Σ2", "K2", "+Σ3", "I", ".c", "C"),
        edge("N", "Σ3", "+"),
        edge(".c", "K3", undefined, [7, 1]),
        edge("K3", "Σ2", "−", [3, 1]),
        edge(".c", "K4", undefined, [7, 2]),
        edge("K4", "Σ1", "−", [2, 2]),
      ],
    ),
    [
      select(
        "¿Qué entrada permanece activa para C/R?",
        ["R", "N"],
        0,
        "Anulá la perturbación.",
        "Para C/R se usa N=0.",
      ),
      eq(
        "Señales",
        "Escribí s·C en función de r, c e n.",
        "K2*(K1*r-K4*c-K3*c)+n",
        "N se suma después de K₂.",
        "Ambos retornos se restan.",
      ),
      result("K1*K2/(s+K2*(K3+K4))"),
      select(
        "¿Qué entrada permanece activa para C/N?",
        ["R", "N"],
        1,
        "Anulá la referencia.",
        "Para C/N se usa R=0.",
      ),
      result("1/(s+K2*(K3+K4))", "C/N"),
      eq(
        "Error estacionario",
        "Si el cierre es estable, escribí el error R−C ante escalón unitario de referencia, con N=0.",
        "1-K1/(K3+K4)",
        "Usá la ganancia estática de C/R.",
        "El polo está en −K₂(K₃+K₄); se exige K₂(K₃+K₄)>0.",
      ),
      eq(
        "Ajuste",
        "¿Qué valor debe tomar K₁ para anular el error de referencia?",
        "K3+K4",
        "Igualá la ganancia estática a uno.",
        "La referencia se sigue sin error si el cierre además es estable.",
      ),
      eq(
        "Perturbación",
        "Si R=0 y N es escalón unitario, escribí el valor final de R−C.",
        "-1/(K2*(K3+K4))",
        "La salida se resta al calcular el error.",
        "Para ganancias finitas que estabilizan el cierre, el error de perturbación es distinto de cero.",
      ),
    ],
    {
      note: "Los errores pedidos corresponden a R−C. Se verifica la condición K₂(K₃+K₄)>0 antes de aplicar valor final.",
    },
  ),
  lesson(
    "D14",
    "57 · arriba",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        ["A", 2, 0],
        [".x", 3, 0],
        ["D", 4, 0],
        [".c", 5, 0],
        ["C", 6, 0],
        ["B", 2, 1],
      ],
      [
        ...chain("R", "+Σ1", "A", ".x", "D", ".c", "C"),
        edge(".x", "B", undefined, [3, 1]),
        edge("B", "Σ1", "−", [1, 1]),
        edge(".c", "Σ1", "+", [5, -1], [1, -1]),
      ],
    ),
    [
      select(
        "¿Qué bloque recibe la toma antes de D?",
        ["A", "B", "D"],
        1,
        "Seguí el retorno inferior.",
        "B recibe X, la salida de A.",
      ),
      sign(
        "¿El retorno directo desde C suma o resta?",
        true,
        "C vuelve por la entrada superior positiva.",
      ),
      eq(
        "Lazo interior",
        "Cerrá A con el retorno B.",
        "A/(1+A*B)",
        "Sostené como entrada externa la suma R+C.",
        "El retorno B se resta.",
      ),
      result("A*D/(1+A*B-A*D)"),
    ],
    {
      transformed: [
        {
          stage: 2,
          title: "A y B reducidos",
          diagram: reducedFeedback(["A/(1+A·B)", "D"], "+"),
        },
      ],
    },
  ),
  lesson(
    "D15",
    "57 · abajo",
    wire(
      [
        ["R", 0, 0],
        ["Σ1", 1, 0],
        [".e", 2, 0],
        ["G", 3, 0],
        [".x", 4, 0],
        ["Σ2", 5, 0],
        ["C", 6, 0],
        ["H2", 3, -1],
        ["H1", 3, 1],
      ],
      [
        ...chain("R", "+Σ1", ".e", "G", ".x", "+Σ2", "C"),
        edge(".e", "H2", undefined, [2, -1]),
        edge("H2", "Σ2", "+", [5, -1]),
        edge(".x", "H1", undefined, [4, 1]),
        edge("H1", "Σ1", "−", [1, 1]),
      ],
    ),
    [
      select(
        "¿Desde la salida de qué bloque se alimenta H₁?",
        ["G", "H2", "Σ2"],
        0,
        "La toma está antes del sumador de salida.",
        "H₁ recibe solo la salida de G.",
      ),
      eq(
        "Señales",
        "Si e1 sale de Σ1, escribí el retorno que se resta en función de e1.",
        "H1*G*e1",
        "H₁ recibe la salida de G.",
        "La rama H₂ no entra a H₁.",
      ),
      eq(
        "Paralelo",
        "Escribí C/e1.",
        "G+H2",
        "Las ramas comparten la entrada del sumador final.",
        "Se suman sus salidas.",
      ),
      result("(G+H2)/(1+G*H1)"),
    ],
    {
      note: "El primer dibujo toma el retorno antes de Σ2. La reducción manuscrita lo mueve a C sin compensación y altera el denominador.",
    },
  ),
];

export const blockReductions = Object.fromEntries(originalBlockExercises.map(exercise => [exercise.id, reductionLesson(exercise)]));

type ReturnPath = { take: string; sum: string; row: number; label?: string; positive?: boolean };

function partialDiagram(path: Node[], returns: ReturnPath[], branches: Node[] = [], links: Edge[] = []) {
  const nodes = [...path, ...branches];
  const edges = chain(...path.map(([id]) => id.startsWith("Σ") ? "+" + id : id));
  for (const { take, sum, row, label, positive } of returns) {
    const source = nodes.find(([id]) => id === take)!;
    const target = nodes.find(([id]) => id === sum)!;
    const incoming = positive ? "+" : "−";
    if (label) {
      const id = "H" + row;
      nodes.push([id, (source[1] + target[1]) / 2, row, label]);
      edges.push(edge(take, id, undefined, [source[1], row]), edge(id, sum, incoming, [target[1], row]));
    } else {
      edges.push(edge(take, sum, incoming, [source[1], row], [target[1], row]));
    }
  }
  return wire(nodes, [...edges, ...links]);
}

function forward(...blocks: string[]): Node[] {
  const ids = blocks.map((label, index): Node => {
    const column = index + 1;
    if (label.startsWith(".")) return [label, column, 0, label.slice(1)];
    return label.startsWith("Σ") ? [label, column, 0] : ["G" + column, column, 0, label];
  });
  return [["R", 0, 0], ...ids, ["C", ids.length + 1, 0]];
}

const inner: ReturnPath = { take: ".X", sum: "Σ2", row: 1 };
const outer: ReturnPath = { take: ".C", sum: "Σ1", row: 3 };
const closes = (label?: string) => ({ ...outer, label });
const reducedStep = (prompt: string, answer: string, hint: string, explanation: string) =>
  eq("Reducción local", prompt, answer, hint, explanation);
const series = (answer: string) =>
  reducedStep("Escribí el producto de la cadena directa del lazo exterior, antes de cerrarlo.", answer,
    "Multiplicá los bloques que recorre la señal desde el sumador exterior hasta C.",
    "En serie la salida de un bloque es la entrada del siguiente.");
const loop = (name: string, answer: string, positive = false) =>
  reducedStep(`Escribí el equivalente de ${name}.`, answer,
    positive ? "El retorno positivo da Q/(1−QH)." : "El retorno negativo da Q/(1+QH).",
    "El equivalente conserva la relación entre la entrada del sumador y la salida de la toma.");
const snapshot = (stage: number, title: string, blocks: string[], label?: string) =>
  ({ stage, title, diagram: partialDiagram(forward("Σ1", ...blocks, ".C"), [closes(label)]) });
const partialBlockExercises = [
  lesson("P1.1", "1",
    partialDiagram(forward("Σ1", "Σ2", "4/(s+2)", ".X", "1/(s+5)", ".C"), [inner, closes("2")]),
    [
      select("¿De qué toma nace el retorno unitario a Σ2?", [".X", ".C"], 0,
        "Seguí hacia atrás la flecha que entra por debajo de Σ2.",
        "La toma X está entre 4/(s+2) y 1/(s+5)."),
      sign("¿Con qué signo entra ese retorno en Σ2?", false, "La flecha llega a la entrada marcada −."),
      loop("4/(s+2) y su retorno unitario", "4/(s+6)"),
      series("4/((s+6)(s+5))"),
      result("4/(s^2+11s+38)"),
    ], { partial: partial("Lazos anidados"), transformed: [
      snapshot(2, "Lazo interno reducido", ["4/(s+6)", "1/(s+5)"], "2"),
      snapshot(3, "Serie reducida", ["4/[(s+6)(s+5)]"], "2"),
    ] }),
  lesson("P1.2", "1",
    partialDiagram(forward("Σ1", "−2", "Σ2", "1/(s+4)", ".X", ".C"),
      [{ ...inner, positive: true }, closes("1/(s+1)")]),
    [
      sign("¿Con qué signo entra el retorno unitario en Σ2?", true, "La toma X entra al terminal + de Σ2."),
      loop("1/(s+4) en el lazo interno", "1/(s+3)", true),
      series("-2/(s+3)"),
      result("-2(s+1)/(s^2+4s+1)"),
    ], { partial: partial("Retorno positivo"), transformed: [
      snapshot(1, "Lazo positivo reducido", ["−2", "1/(s+3)"], "1/(s+1)"),
      snapshot(2, "Serie con ganancia negativa", ["−2/(s+3)"], "1/(s+1)"),
    ] }),
  lesson("P1.3", "1",
    partialDiagram([["R", 0, 0], ["Σ1", 1, 0], [".B", 2, 0, "B"]], [closes("s")],
      [["A", 3, -1, "2/(s+1)"], ["B", 3, 1, "3/(s+1)"], ["Σ2", 4, 0],
        ["G", 5, 0, "1/(s+2)"], [".C", 6, 0], ["C", 7, 0]], [
        edge(".B", "A", undefined, [2, -1]), edge(".B", "B", undefined, [2, 1]),
        edge("A", "Σ2", "+", [4, -1]), edge("B", "Σ2", "+", [4, 1]),
        ...chain("Σ2", "G", ".C", "C"),
      ]),
    [
      reducedStep("Escribí el equivalente del paralelo que entra en Σ2.", "5/(s+1)",
        "Ambas ramas reciben B y entran con signo positivo.", "Las dos transferencias se suman."),
      series("5/((s+1)(s+2))"),
      result("5/(s^2+8s+2)"),
    ], { partial: partial("Paralelo y retorno derivativo"), transformed: [
      snapshot(0, "Paralelo reducido", ["5/(s+1)", "1/(s+2)"], "s"),
      snapshot(1, "Serie reducida", ["5/[(s+1)(s+2)]"], "s"),
    ] }),
  lesson("P1.4", "1",
    partialDiagram(forward("Σ1", "6", "Σ2", "1/(s+1)", "1/(s+2)", ".X", ".C"),
      [{ ...inner, label: "3" }, closes("1/(s+3)")]),
    [
      reducedStep("Multiplicá los dos bloques comprendidos entre Σ2 y X.", "1/((s+1)(s+2))",
        "La ganancia 6 queda antes de Σ2.", "Solo los bloques recorridos hasta X forman esta serie."),
      loop("la serie interna con retorno 3", "1/(s^2+3s+5)"),
      series("6/(s^2+3s+5)"),
      result("6(s+3)/(s^3+6s^2+14s+21)"),
    ], { partial: partial("Serie dentro del lazo"), transformed: [
      { stage: 0, title: "Serie interna reducida", diagram:
        partialDiagram(forward("Σ1", "6", "Σ2", "1/[(s+1)(s+2)]", ".X", ".C"),
          [{ ...inner, label: "3" }, closes("1/(s+3)")]) },
      snapshot(1, "Lazo interno reducido", ["6", "1/(s²+3s+5)"], "1/(s+3)"),
      snapshot(2, "Serie exterior reducida", ["6/(s²+3s+5)"], "1/(s+3)"),
    ] }),
  lesson("P1.5", "2",
    partialDiagram(forward("Σ1", "Σ2", "2/s", ".X", "Σ3", "3/(s+1)", ".Y", ".C"),
      [inner, { take: ".Y", sum: "Σ3", row: 1 }, outer]),
    [
      select("¿Qué toma alimenta el retorno de Σ3?", [".X", ".Y", ".C"], 1,
        "Seguí el retorno interior que vuelve a Σ3.", "Y es la toma inmediatamente posterior a 3/(s+1)."),
      loop("2/s con su retorno unitario", "2/(s+2)"),
      loop("3/(s+1) con su retorno unitario", "3/(s+4)"),
      series("6/((s+2)(s+4))"),
      result("6/(s^2+6s+14)"),
    ], { partial: partial("Tres retornos unitarios"), transformed: [
      { stage: 1, title: "Primer lazo reducido", diagram:
        partialDiagram(forward("Σ1", "2/(s+2)", "Σ3", "3/(s+1)", ".Y", ".C"),
          [{ take: ".Y", sum: "Σ3", row: 1 }, outer]) },
      snapshot(2, "Ambos lazos internos reducidos", ["2/(s+2)", "3/(s+4)"]),
      snapshot(3, "Serie exterior reducida", ["6/[(s+2)(s+4)]"]),
    ] }),
];

export const blockExercises = [...originalBlockExercises, ...partialBlockExercises];

export function finalDiagram(label: string, source: Diagram, prompt: string) {
  const transfer = prompt.match(/Escribí ([CY])\/([RDNU]) como/);
  return reduced(label, transfer?.[2] ?? source.nodes[0][0], transfer?.[1]);
}
