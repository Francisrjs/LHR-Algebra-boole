import { manualRows, manualValue } from "../bodeManual";
import type { BodeDecomposition } from "../types";
import type { Step } from "./session";
import type { Exercise } from "./exercise";
import { partial } from "./exercise";

const factorColors = [
  "#dab967",
  "#84c6ba",
  "#83abf1",
  "#d89ccb",
  "#e58a6b",
  "#bc9cff",
  "#ffcf88",
];
export type Layer = {
  label: string;
  color: string;
  style:
    | "factor"
    | "partial"
    | "total"
    | "exact"
    | "marker"
    | "frequency"
    | "slope"
    | "identity"
    | "pole"
    | "zero";
  points: [number, number][];
};
export type BodeExercise = Exercise & {
  page: number | string;
  formula: string;
  range: [number, number];
  decomposition: BodeDecomposition;
  steps: Step[];
  layers: { mag: [number, Layer][]; phase: [number, Layer][] };
  identified: { stage: number; label: string; color: string }[];
  intervals: {
    stage: number;
    start: number;
    end: number;
    slope: number;
    magnitude: number;
  }[];
};

type Factor = [frequency: number, signedMultiplicity: number, order?: 2];
type Model = {
  id: string;
  page: number | string;
  formula: string;
  gain: number;
  factors: Factor[];
  range: [number, number];
  exactGainCrossings?: number[];
  exactPhaseCrossings?: number[];
  interpretation: string;
  stability?: "Estable" | "Inestable";
  partial?: Exercise["partial"];
};
const models: Model[] = [
  {
    id: "B1",
    page: 33,
    formula: "10⁵ / [s(s + 100)(s + 1000)]",
    gain: 1,
    factors: [
      [0, -1],
      [100, -1],
      [1000, -1],
    ],
    range: [0.01, 10000],
    exactGainCrossings: [0.999949509],
    exactPhaseCrossings: [Math.sqrt(100000)],
    stability: "Estable",
    interpretation:
      "Con realimentación unitaria negativa el cierre es estable. Ambos márgenes son positivos. La fase total es −135° a 100 rad/s y −225° a 1000 rad/s. La recta encuentra −180° a √(100·1000) rad/s, donde la magnitud vale −60 dB.",
  },
  {
    id: "B2",
    page: 34,
    formula: "10⁶s(s + 10) / [(s + 1)²(s + 100)²]",
    gain: 1000,
    factors: [
      [0, 1],
      [1, -2],
      [10, 1],
      [100, -2],
    ],
    range: [0.0001, 10000],
    exactGainCrossings: [0.001000000995, 995.012307],
    exactPhaseCrossings: [],
    stability: "Estable",
    interpretation:
      "Las rectas dan márgenes nulos en el cruce descendente. La fase exacta se acerca a −180° desde arriba. El cruce ascendente tiene MF ≈ −90,11° y el descendente ≈ 11,02°. El cierre unitario negativo tiene cuatro polos con parte real negativa.",
  },
  {
    id: "B3",
    page: 35,
    formula: "10(s + 1) / [s(s + 10)²]",
    gain: 0.1,
    factors: [
      [0, -1],
      [1, 1],
      [10, -2],
    ],
    range: [0.01, 1000],
    exactGainCrossings: [0.10049353],
    exactPhaseCrossings: [],
    stability: "Estable",
    interpretation:
      "La recta llega a −180° a 100 rad/s. La fase exacta se acerca a ese ángulo sin alcanzarlo a frecuencia finita, de modo que el MG exacto es infinito. El polinomio del cierre unitario negativo es s³+20s²+110s+10.",
  },
  {
    id: "B4",
    page: 36,
    formula: "10⁻⁵(s + 10)(s + 100)(s + 1000) / s³",
    gain: 10,
    factors: [
      [0, -3],
      [10, 1],
      [100, 1],
      [1000, 1],
    ],
    range: [0.01, 10000],
    exactGainCrossings: [2.171210958],
    exactPhaseCrossings: [30.01501126],
    stability: "Inestable",
    interpretation:
      "Se conserva la rama desde −270°. El margen de fase es negativo. El cierre unitario negativo tiene dos polos en el semiplano derecho.",
  },
  {
    id: "B5",
    page: 37,
    formula: "10⁵s² / [(s + 10)(s + 100)(s + 1000)]",
    gain: 0.1,
    factors: [
      [0, 2],
      [10, -1],
      [100, -1],
      [1000, -1],
    ],
    range: [0.01, 1000000],
    exactGainCrossings: [3.24320115, 99994.94937],
    exactPhaseCrossings: [],
    stability: "Estable",
    interpretation:
      "El primer cruce de 0 dB es ascendente y el segundo descendente. La fase exacta va de +180° hacia −90° y se conserva esa rama en el gráfico. El primer MF firmado es ≈ −20,01° (distancia de ≈ 20° a +180°, reportada sin signo en el apunte). El segundo es ≈ 90,64°. El cierre unitario negativo tiene tres polos con parte real negativa.",
  },
  {
    id: "B6",
    page: "Ejemplo por contribuciones",
    formula: "10⁷(s²+s+1) / [s(s+1)(s+10)(s+100)(s+1000)]",
    gain: 10,
    factors: [
      [0, -1],
      [1, -1],
      [1, 1, 2],
      [10, -1],
      [100, -1],
      [1000, -1],
    ],
    range: [0.01, 100000],
    interpretation: "El par de ceros suma 180° y la fase final es −270°.",
  },
  {
    id: "P3.1", page: 4, partial: partial("Tres polos simples"),
    formula: "10⁴ / [(s+1)(s+10)(s+100)]",
    gain: 10, factors: [[1, -1], [10, -1], [100, -1]], range: [0.01, 10000],
    exactGainCrossings: [7.798], exactPhaseCrossings: [Math.sqrt(1110)],
    stability: "Estable",
    interpretation: "D+N = s³+111s²+1110s+11000 tiene sus tres polos en el semiplano izquierdo.",
  },
  {
    id: "P3.2", page: 4, partial: partial("Integrador y dos polos"),
    formula: "2000 / [s(s+1)(s+20)]",
    gain: 100, factors: [[0, -1], [1, -1], [20, -1]], range: [0.01, 1000],
    exactGainCrossings: [9.480], exactPhaseCrossings: [Math.sqrt(20)],
    stability: "Inestable",
    interpretation: "La primera columna de Routh de s³+21s²+20s+2000 tiene dos cambios de signo.",
  },
  {
    id: "P3.3", page: 4, partial: partial("Dos cruces de magnitud"),
    formula: "10⁵s² / [(s+1)(s+10)²(s+100)]",
    gain: 10, factors: [[0, 2], [1, -1], [10, -2], [100, -1]], range: [0.01, 10000],
    exactGainCrossings: [0.32441, 308.252], exactPhaseCrossings: [],
    stability: "Estable",
    interpretation: "Hay un cruce ascendente con MF negativo y uno descendente con MF positivo. Los cuatro polos de D+N tienen parte real negativa.",
  },
  {
    id: "P3.4", page: 4, partial: partial("Polos cercanos"),
    formula: "20000 / [(s+1)(s+2)(s+10)]",
    gain: 1000, factors: [[1, -1], [2, -1], [10, -1]], range: [0.01, 1000],
    exactGainCrossings: [26.518], exactPhaseCrossings: [Math.sqrt(32)],
    stability: "Inestable",
    interpretation: "En s³+13s²+32s+20020 se cumple 13·32 < 20020. Routh da dos polos en el semiplano derecho.",
  },
  {
    id: "P3.5", page: 5, partial: partial("Ceros complejos"),
    formula: "10⁷(s²+s+1) / [s(s+10)(s+100)(s+1000)]",
    gain: 10, factors: [[0, -1], [1, 1, 2], [10, -1], [100, -1], [1000, -1]],
    range: [0.01, 100000], exactGainCrossings: [3083.373], exactPhaseCrossings: [],
    stability: "Estable",
    interpretation: "El par de ceros aporta 0 dB y +90° a 1 rad/s. D+N tiene cuatro polos con parte real negativa.",
  },
];

const phaseMargin = (phase: number) =>
  ((((phase + 360) % 360) + 360) % 360) - 180;

function exactValue(model: Model, omega: number) {
  let magnitude = 20 * Math.log10(model.gain);
  let phase = 0;
  for (const [frequency, multiplicity, order] of model.factors) {
    if (order === 2) {
      const ratio = omega / frequency;
      const re = 1 - ratio ** 2;
      const im = ratio; // 2ζω/ωn, con ζ = 0,5 para s²+s+1.
      magnitude += multiplicity * 20 * Math.log10(Math.hypot(re, im));
      phase += multiplicity * Math.atan2(im, re) * 180 / Math.PI;
      continue;
    }
    magnitude += frequency
      ? multiplicity * 10 * Math.log10(1 + (omega / frequency) ** 2)
      : multiplicity * 20 * Math.log10(omega);
    phase +=
      multiplicity *
      (frequency ? (Math.atan(omega / frequency) * 180) / Math.PI : 90);
  }
  return { magnitude, phase };
}

function crossings(points: [number, number][], level: number) {
  const result: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const [omega, value] = points[i];
    const previous = points[i - 1];
    if (value === level && previous?.[1] !== level) result.push(omega);
    if (!previous || (value - level) * (previous[1] - level) >= 0) continue;
    result.push(
      previous[0] *
        (omega / previous[0]) **
          ((level - previous[1]) / (value - previous[1])),
    );
  }
  return result;
}

function refineCrossing(model: Model, near: number, axis: "magnitude" | "phase", level: number) {
  let left = near * 0.99;
  let right = near * 1.01;
  const difference = (omega: number) => exactValue(model, omega)[axis] - level;
  const ascending = difference(left) < 0;
  for (let i = 0; i < 48; i++) {
    const middle = (left + right) / 2;
    if ((difference(middle) < 0) === ascending) left = middle;
    else right = middle;
  }
  return (left + right) / 2;
}

function build(model: Model): BodeExercise {
  const { id, page, formula, range, gain } = model;
  const factors = model.factors.map(
    ([frequency, multiplicity, order = 1], i) => ({
      id: String(i),
      label: frequency ? `ωb = ${frequency} rad/s` : "Origen",
      latex: "",
      frequency,
      multiplicity: Math.abs(multiplicity),
      kind: multiplicity > 0 ? ("zero" as const) : ("pole" as const),
      order,
      slope: 20 * multiplicity * order,
      phaseFinal: 90 * multiplicity * order,
      phaseAvailable: true,
      transition: frequency
        ? ([frequency / 10, frequency * 10] as [number, number])
        : null,
      magnitude: [],
      phase: [],
      marker: null,
      markerPhase: null,
      root:
        order === 2
          ? { re: -0.5, im: Math.sqrt(3) / 2 }
          : { re: -frequency, im: 0 },
    }),
  );
  const decomposition = {
    gain,
    gainDb: 20 * Math.log10(gain),
    gainPhase: 0,
    factors,
    segments: [],
    warning: "",
  } satisfies BodeDecomposition;
  const rows = manualRows(decomposition, range);
  const layers: BodeExercise["layers"] = { mag: [], phase: [] };
  const identified: BodeExercise["identified"] = [];
  const intervals: BodeExercise["intervals"] = [];
  const steps: Step[] = [];
  const add = (
    concept: string,
    prompt: string,
    answer: Step["answer"],
    hint: string,
    explanation: string,
    extra: Partial<Step> = {},
  ) => {
    const stage = steps.length;
    steps.push({
      id: `${id}.${stage + 1}`,
      concept,
      prompt,
      answer,
      hint,
      explanation,
      ...extra,
    });
    return stage;
  };
  const line = (
    axis: keyof typeof layers,
    stage: number,
    label: string,
    color: string,
    style: Layer["style"],
    points: Layer["points"],
  ) => layers[axis].push([stage, { label, color, style, points }]);
  const number = (value: number, unit = "", tolerance?: number) => ({
    value,
    unit,
    tolerance,
  });
  const name = (i: number) => `Factor ${i + 1} · ${factors[i].label}`;
  const finite = factors
    .map((f) => f.frequency)
    .filter((w) => w > 0)
    .sort((a, b) => a - b);
  const phaseLimits = [
    ...new Set(finite.flatMap((w) => [w / 10, w, w * 10])),
  ].sort((a, b) => a - b);
  const magPoints: Layer["points"] = rows.map((r) => [r.omega, r.magnitude!]);
  const phasePoints: Layer["points"] = rows.map((r) => [r.omega, r.phase!]);
  const normalized = add(
    "Normalización",
    "Extraé la constante de cada binomio. ¿Cuál es la ganancia normalizada?",
    number(gain),
    "Usá s + a = a(1 + s/a). Las constantes del denominador dividen.",
    `G(s) = ${gain} × ${
      factors
        .filter((f) => f.kind === "zero")
        .map((f) =>
          f.order === 2
            ? "(s²+s+1)"
            : f.frequency
              ? `(1+s/${f.frequency})^${f.multiplicity}`
              : `s^${f.multiplicity}`,
        )
        .join(" · ") || "1"
    } / [${
      factors
        .filter((f) => f.kind === "pole")
        .map((f) =>
          f.order === 2
            ? "(s²+s+1)"
            : f.frequency
              ? `(1+s/${f.frequency})^${f.multiplicity}`
              : `s^${f.multiplicity}`,
        )
        .join(" · ") || "1"
    }].`,
  );
  identified.push({
    stage: normalized,
    label: "Ganancia K = " + gain,
    color: factorColors[0],
  });
  const gainMag = add(
    "Ganancia",
    "¿Cuánto aporta la ganancia normalizada a la magnitud?",
    number(decomposition.gainDb, "dB"),
    "Calculá 20 log₁₀(K).",
    "La ganancia constante aporta el mismo nivel a todas las frecuencias.",
  );
  line(
    "mag",
    gainMag,
    `Ganancia · ${decomposition.gainDb} dB`,
    factorColors[0],
    "factor",
    rows.map((r) => [r.omega, decomposition.gainDb]),
  );
  factors.forEach((f, i) => {
    const description =
      f.order === 2
        ? "Par de ceros complejos"
        : `${f.kind === "pole" ? "Polo" : "Cero"} ${["", "simple", "doble", "triple"][f.multiplicity]}`;
    const identity = add(
      "Factores",
      `Identificá el factor ${f.order === 2 ? "s²+s+1" : f.frequency ? `asociado a s = −${f.frequency}` : "en el origen"}.`,
      description,
      "El numerador aporta ceros, el denominador polos. Contá las repeticiones.",
      `${name(i)}. ${description}.`,
      {
        choices: [
          "Polo simple",
          "Polo doble",
          "Polo triple",
          "Cero simple",
          "Cero doble",
          "Cero triple",
          ...(f.order === 2 ? ["Par de ceros complejos"] : []),
        ],
      },
    );
    identified.push({
      stage: identity,
      label: `Factor ${i + 1} · ${description}`,
      color: factorColors[i + 1],
    });
    const symbol = f.kind === "pole" ? "×" : "○";
    const factorLabel =
      symbol + " " + description + (f.frequency ? "" : " en el origen · ω = 0");
    for (const axis of ["mag", "phase"] as const) {
      const label =
        axis === "mag"
          ? (f.slope > 0 ? "+" : "") + f.slope + " dB/década"
          : (f.frequency ? "0° → " : "") + f.phaseFinal + "°";
      line(
        axis,
        identity,
        factorLabel +
          (f.frequency ? " · " + f.frequency + " rad/s" : "") +
          " · " +
          label,
        factorColors[i + 1],
        "factor",
        rows.map((r) => [
          r.omega,
          axis === "mag" ? r.magnitudes[i] : r.phases[i]!,
        ]),
      );
      const anchor = f.frequency || 1;
      const value = manualValue(decomposition, anchor);
      line(
        axis,
        identity,
        factorLabel + (f.frequency ? " · " + f.frequency + " rad/s" : ""),
        factorColors[i + 1],
        f.kind,
        [[anchor, axis === "mag" ? value.magnitudes[i] : value.phases[i]!]],
      );
    }
    if (f.frequency) {
      add(
        "Quiebre",
        `¿A qué frecuencia quiebra el factor ${i + 1}?`,
        number(f.frequency, "rad/s", 0.055),
        "Buscá la constante a en 1 + s/a.",
        "El quiebre de magnitud ocurre en ω = a.",
        {
          answer: {
            value: f.frequency,
            unit: "rad/s",
            tolerance: 0.055,
            logarithmic: true,
          },
          pick: "frequency",
        },
      );
    }
    const slopeStage = add(
      "Pendiente",
      `¿Qué pendiente aporta el factor ${i + 1} ${f.frequency ? "después del quiebre" : "en toda la banda"}?`,
      number(f.slope, "dB/década"),
      "Cada cero suma 20 y cada polo resta 20 dB/década.",
      "Multiplicá por el orden del factor.",
    );
    const anchor = Math.min(range[1], (f.frequency || range[0]) * Math.sqrt(10));
    line("mag", slopeStage, (f.slope > 0 ? "+" : "") + f.slope + " dB/déc",
      factorColors[i+1], "slope", [[anchor, manualValue(decomposition, anchor).magnitudes[i]]]);
    const w = f.frequency ? f.frequency * 10 : range[0];
    const magnitude = manualValue(decomposition, w).magnitudes[i];
    const stage = add(
      "Magnitud individual",
      `Calculá el aporte del factor ${i + 1} en ω = ${w} rad/s.`,
      number(manualValue(decomposition, w).magnitudes[i], "dB"),
      f.frequency
        ? "En el quiebre aporta 0 dB. Una década después, el nivel cambia en una pendiente."
        : "Para un factor en el origen, usá su pendiente por log₁₀(ω).",
      `El punto confirma la recta individual del factor ${i + 1}.`,
    );
    line(
      "mag",
      stage,
      `${name(i)} · ${magnitude} dB a ${w} rad/s`,
      factorColors[i + 1],
      "marker",
      [[w, magnitude]],
    );
  });
  const initialMag = add(
    "Magnitud inicial",
    `Sumá los aportes de magnitud en ω = ${range[0]} rad/s.`,
    number(magPoints[0][1], "dB"),
    "Sumá la ganancia y el aporte de origen en dB.",
    "Este punto ancla el primer tramo de la suma.",
  );
  line("mag", initialMag, "Inicio de magnitud", "#f8e6ae", "partial", [
    magPoints[0],
  ]);
  const starts = [range[0], ...new Set(finite)];
  starts.forEach((w, i) => {
    const end = starts[i + 1] ?? range[1];
    if (i > 0) {
      const active = factors.filter((f) => f.frequency === w);
      const index = factors.indexOf(active[0]);
      if (active.length === 1)
        add(
          "Suma por intervalos",
          `¿Qué factor cambia la pendiente en ω = ${w} rad/s?`,
          `Factor ${index + 1}`,
          "Compará ω con los quiebres de los factores finitos.",
          "En este punto comienza el aporte de magnitud de ese factor.",
          { choices: factors.map((_, j) => `Factor ${j + 1}`) },
        );
      add(
        "Cambio de pendiente",
        `¿En cuánto cambia la pendiente al pasar por ω = ${w} rad/s?`,
        number(
          active.reduce((sum, f) => sum + f.slope, 0),
          "dB/década",
        ),
        "El cambio es el aporte del factor que se activa.",
        "Conservá el signo de este incremento al actualizar la pendiente total.",
      );
    }
    const slope = manualValue(decomposition, w).slope;
    add(
      "Suma por intervalos",
      `Calculá la pendiente total de ${w} a ${end} rad/s.`,
      number(slope, "dB/década"),
      "Sumá las pendientes de los factores activos.",
      "Los aportes de los factores ya activos se mantienen en la suma.",
    );
    const magnitude = manualValue(decomposition, end).magnitude!;
    const stage = add(
      "Continuidad",
      `Calculá el nivel total en ω = ${end} rad/s al final de este tramo.`,
      number(magnitude, "dB"),
      "Usá M₂ = M₁ + m log₁₀(ω₂/ω₁).",
      "La recta nueva comienza en el nivel que dejó el tramo anterior.",
    );
    intervals.push({ stage, start: w, end, slope, magnitude });
    const final = i === starts.length - 1;
    line(
      "mag",
      stage,
      final ? "Magnitud total" : "Magnitud parcial",
      "#f8e6ae",
      final ? "total" : "partial",
      [magPoints[0], ...intervals.map(({ end, magnitude }): [number, number] => [end, magnitude])],
    );
  });
  const gainPhaseStage = add(
    "Fase de ganancia",
    "¿Qué ángulo aporta la ganancia positiva?",
    number(0, "°"),
    "Una constante real positiva queda sobre el eje real positivo.",
    "Su aporte de fase es 0°.",
  );
  line(
    "phase",
    gainPhaseStage,
    "Ganancia",
    factorColors[0],
    "factor",
    rows.map((r) => [r.omega, 0]),
  );
  factors.forEach((f, i) => {
    if (f.frequency) {
      const transition = [
        [f.frequency / 10, "empieza"],
        [f.frequency, "está en el centro"],
        [f.frequency * 10, "termina"],
      ] as const;
      transition.forEach(([w, action], j) => {
        const stage = add(
          "Transición de fase",
          `¿A qué frecuencia ${action} la transición del factor ${i + 1}?`,
          { value: w, unit: "rad/s", logarithmic: true, tolerance: 0.055 },
          "La transición abarca una década antes y una después de ωb.",
          "Las tres referencias son ωb/10, ωb y 10ωb.",
          { pick: "frequency" },
        );
        line(
          "phase",
          stage,
          `${["Inicio", "Centro", "Fin"][j]} del factor ${i + 1}`,
          factorColors[i + 1],
          "frequency",
          [[w, 0]],
        );
      });
    }
    const w = f.frequency || range[0];
    let stage = add(
      "Fase individual",
      `¿Cuántos grados aporta el factor ${i + 1} en ω = ${w} rad/s?`,
      number(manualValue(decomposition, w).phases[i]!, "°"),
      f.frequency
        ? "En el centro de transición el factor aporta la mitad de su ángulo final."
        : "Cada integrador aporta −90°. Cada cero en origen aporta +90°.",
      f.frequency
        ? "El punto medio fija el aporte en ωb."
        : "La fase en el origen es constante.",
    );
    const angle = manualValue(decomposition, w).phases[i]!;
    line(
      "phase",
      stage,
      `${name(i)} · ${angle}° a ${w} rad/s`,
      factorColors[i + 1],
      "marker",
      [[w, angle]],
    );
    if (f.frequency) {
      stage = add(
        "Pendiente de fase",
        `¿Cuál es la pendiente del factor ${i + 1} durante su transición?`,
        number(f.phaseFinal / 2, "°/década"),
        "Dividí el cambio total de ángulo por las dos décadas que dura la transición.",
        "El signo indica si se acumula adelanto o atraso de fase.",
      );
    }
  });
  [
    range[0],
    ...phaseLimits.filter((w) => w > range[0] && w < range[1]),
    range[1],
  ].forEach((w, i, points) => {
    const stage = add(
      "Suma de fase",
      `Sumá los ángulos en ω = ${w} rad/s.`,
      number(manualValue(decomposition, w).phase!, "°"),
      "Sumá el aporte en origen y la fracción activa de cada transición.",
      "La rama continua conserva la suma algebraica de los ángulos.",
    );
    const final = i === points.length - 1;
    line(
      "phase",
      stage,
      final ? "Fase total" : "Fase parcial",
      "#f8e6ae",
      final ? "total" : "partial",
      points.slice(0, i + 1).map(omega => [omega, manualValue(decomposition, omega).phase!]),
    );
  });
  function margins(exact: boolean) {
    const origin = exact ? "exacto" : "por rectas";
    const gc = exact
      ? (model.exactGainCrossings ?? []).map((w) => model.partial ? refineCrossing(model, w, "magnitude", 0) : w)
      : crossings(magPoints, 0);
    const pc = exact
      ? (model.exactPhaseCrossings ?? []).map((w) => model.partial ? refineCrossing(model, w, "phase", -180) : w)
      : crossings(phasePoints, -180);
    const response = (w: number) =>
      exact ? exactValue(model, w) : manualValue(decomposition, w);
    for (const [axis, frequencies] of [
      ["mag", gc],
      ["phase", pc],
    ] as const) {
      const isGain = axis === "mag";
      const target = isGain ? "0 dB" : "−180°";
      if (!frequencies.length) {
        add(
          "Cruces",
          `¿Existe un cruce ${origin} de ${target} a frecuencia finita?`,
          "Ninguno",
          "Un límite al infinito no corresponde a una frecuencia finita.",
          isGain ? "La magnitud no cambia de lado alrededor de 0 dB." :
            "Con la convención habitual, la ausencia de cruce de fase implica MG infinito.",
          { choices: ["Ninguno", "Un cruce", "Dos cruces"] },
        );
        if (model.partial && exact && !isGain) {
          add("Márgenes", "¿Cuál es el MG exacto?", "Infinito",
            "Buscá un cruce finito con el semieje real negativo.",
            "Sin ese cruce, el margen de ganancia es infinito.",
            { choices: ["Infinito", "0 dB", "−∞ dB"] });
        }
      }
      frequencies.forEach((w, i) => {
        const direction = isGain
          ? response(w * 1.002).magnitude! > response(w / 1.002).magnitude!
            ? "ascendente"
            : "descendente"
          : "";
        const stage = add(
          "Cruces",
          `Ubicá el ${i === 0 ? "primer" : "segundo"} encuentro ${origin} con ${target}. Ingresá ω en rad/s.`,
          {
            value: w,
            unit: "rad/s",
            logarithmic: true,
            tolerance: exact ? 0.005 : 0.065,
          },
          isGain
            ? "Buscá dónde la magnitud toma 0 dB."
            : "Buscá la primera frecuencia donde la fase toma −180°.",
          `El marcador señala la misma frecuencia en los dos gráficos.${direction && !(model.partial && exact && gc.length > 1) ? " El cruce de magnitud es " + direction + "." : ""}`,
          { pick: "frequency" },
        );
        const value = response(w);
        line(
          "mag",
          stage,
          `Cruce a ${Number(w.toPrecision(5))} rad/s`,
          "#fff",
          "marker",
          [[w, value.magnitude!]],
        );
        line(
          "phase",
          stage,
          `Cruce a ${Number(w.toPrecision(5))} rad/s`,
          "#fff",
          "marker",
          [[w, value.phase!]],
        );
        add(
          "Lectura de márgenes",
          `Leé o calculá ${isGain ? "la fase" : "la magnitud"} ${exact ? "exacta" : "por rectas"} en ω ≈ ${Number(w.toPrecision(5))} rad/s.`,
          number(
            isGain ? value.phase! : value.magnitude!,
            isGain ? "°" : "dB",
            exact ? 0.15 : 2,
          ),
          "Usá la misma frecuencia en el otro gráfico.",
          "La lectura se hace sobre el eje vertical del segundo gráfico.",
          {
            examPrompt: `Calculá ${isGain ? "la fase" : "la magnitud"} ${exact ? "exacta" : "por rectas"} a la frecuencia que ingresaste en el paso anterior.`,
            gradeFromPrevious: (entered) =>
              entered > 0
                ? isGain
                  ? response(entered).phase!
                  : response(entered).magnitude!
                : NaN,
          },
        );
        add(
          "Márgenes",
          `Calculá el ${isGain ? "MF firmado entre −180° y 180°" : "MG (−M)"} en ese cruce ${origin}.`,
          number(
            isGain ? phaseMargin(value.phase!) : -value.magnitude!,
            isGain ? "°" : "dB",
            exact ? 0.15 : 2,
          ),
          isGain
            ? "Sumá 180° a la fase y reducí el resultado módulo 360° al intervalo [−180°, 180°)."
            : "Cambiá el signo de la magnitud en el cruce de fase.",
          `El resultado corresponde al cruce en ω ≈ ${Number(w.toPrecision(5))} rad/s.`,
          { gradeFromPrevious: isGain ? phaseMargin : (entered) => -entered },
        );
        if (model.partial && exact && isGain && gc.length > 1) {
          add("Sentido del cruce", "¿En qué sentido atraviesa la magnitud el nivel de 0 dB?",
            direction === "ascendente" ? "Ascendente" : "Descendente",
            "Compará la magnitud inmediatamente antes y después de la frecuencia de cruce.",
            direction === "ascendente"
              ? "La magnitud pasa de negativa a positiva en dB."
              : "La magnitud pasa de positiva a negativa en dB.",
            { choices: ["Ascendente", "Descendente"] });
        }
      });
    }
  }
  const exercise: BodeExercise = {
    id,
    page,
    formula: (model.partial ? "L(s) = " : model.stability ? "G(s) = " : "GH(s) = ") + formula,
    partial: model.partial,
    range,
    decomposition,
    steps,
    layers,
    identified,
    intervals,
    topic: "Bode directo",
    prompt:
      "Trazá las contribuciones de magnitud y fase. Hallá los márgenes de fase y de ganancia.",
    note: model.interpretation,
  };
  if (!model.stability) {
    exercise.prompt =
      "Trazá cada contribución y sumá las rectas de magnitud y fase.";
    return exercise;
  }
  margins(false);
  const exactStage = add(
    "Modelo exacto",
    "¿Qué expresión permite contrastar las rectas con la transferencia exacta?",
    model.partial ? "L(jω)" : "G(jω)",
    "Evaluá sobre el eje imaginario.",
    "Evaluá 20 log₁₀|L(jω)| y sumá los argumentos de sus factores.",
    { choices: model.partial ? ["L(jω)", "L(ω)", "L(0)"] : ["G(jω)", "G(ω)", "G(0)"] },
  );
  const exactRows = Array.from(
    { length: 321 },
    (_, i) => range[0] * (range[1] / range[0]) ** (i / 320),
  ).map((w) => [w, exactValue(model, w)] as const);
  line(
    "mag",
    exactStage,
    "Magnitud exacta",
    "#ff9c77",
    "exact",
    exactRows.map(([w, v]) => [w, v.magnitude]),
  );
  line(
    "phase",
    exactStage,
    "Fase exacta",
    "#ff9c77",
    "exact",
    exactRows.map(([w, v]) => [w, v.phase]),
  );
  if (id === "P3.5") {
    add("Factor cuadrático", "¿Cuántos dB aporta solo s²+s+1 a ω=1 rad/s?",
      number(0, "dB", 0.15), "Sustituí s=j en el numerador.", "El factor vale j y su módulo es 1.");
    add("Factor cuadrático de fase", "¿Cuál es su fase exacta a ω=1 rad/s?",
      number(90, "°", 0.15), "Ubicá j en el plano complejo.", "El semieje imaginario positivo tiene argumento +90°.");
  }
  margins(true);
  add(
    "Interpretación",
    "¿Qué cambia al aumentar la ganancia positiva del lazo?",
    "La magnitud se desplaza en dB y la fase se mantiene",
    "El argumento de una constante positiva vale 0°.",
    "La diferencia de magnitud es 20 log₁₀ del factor aplicado.",
    {
      choices: [
        "La magnitud se desplaza en dB y la fase se mantiene",
        "Solo se desplaza la fase",
        "Ambas curvas se mantienen",
      ],
    },
  );
  add(
    "Estabilidad",
    model.partial
      ? "Si L=N/D es el lazo abierto, ¿cómo resulta el cierre negativo al analizar D+N?"
      : "Si G=N/D es el lazo de una realimentación unitaria negativa, ¿cómo resulta el cierre al analizar D+N?",
    model.stability,
    "Usá el criterio de Routh sobre D+N para comprobarlo. Considerá el sentido de cada cruce.",
    model.interpretation,
    { choices: ["Estable", "Inestable", "Marginal"] },
  );
  return exercise;
}

export const bodeExercises = models.map(build);
