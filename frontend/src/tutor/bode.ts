import { manualRows, manualValue } from "../bodeManual";
import type { BodeDecomposition } from "../types";
import type { Step } from "./session";
import type { Exercise } from "./exercise";

const factorColors = ["#dab967", "#84c6ba", "#83abf1", "#d89ccb", "#e58a6b"];
export type Layer = {
  label: string;
  color: string;
  style: "factor" | "partial" | "total" | "exact" | "marker" | "frequency";
  points: [number, number][];
};
export type BodeExercise = Exercise & {
  page: number;
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

type Factor = [frequency: number, signedMultiplicity: number];
type Model = {
  id: string;
  page: number;
  formula: string;
  gain: number;
  factors: Factor[];
  range: [number, number];
  exactGainCrossings: number[];
  exactPhaseCrossings: number[];
  interpretation: string;
  stability: "Estable" | "Inestable";
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
];

const phaseMargin = (phase: number) =>
  ((((phase + 360) % 360) + 360) % 360) - 180;

function exactValue(model: Model, omega: number) {
  let magnitude = 20 * Math.log10(model.gain);
  let phase = 0;
  for (const [frequency, multiplicity] of model.factors) {
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

function build(model: Model): BodeExercise {
  const { id, page, formula, range, gain } = model;
  const factors = model.factors.map(([frequency, multiplicity], i) => ({
    id: String(i),
    label: frequency ? `ωb = ${frequency} rad/s` : "Origen",
    latex: "",
    frequency,
    multiplicity: Math.abs(multiplicity),
    kind: multiplicity > 0 ? ("zero" as const) : ("pole" as const),
    order: 1,
    slope: 20 * multiplicity,
    phaseFinal: 90 * multiplicity,
    phaseAvailable: true,
    transition: frequency
      ? ([frequency / 10, frequency * 10] as [number, number])
      : null,
    magnitude: [],
    phase: [],
    marker: null,
    markerPhase: null,
    root: { re: -frequency, im: 0 },
  }));
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
          f.frequency
            ? `(1+s/${f.frequency})^${f.multiplicity}`
            : `s^${f.multiplicity}`,
        )
        .join(" · ") || "1"
    } / [${
      factors
        .filter((f) => f.kind === "pole")
        .map((f) =>
          f.frequency
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
    "Ganancia",
    factorColors[0],
    "factor",
    rows.map((r) => [r.omega, decomposition.gainDb]),
  );
  factors.forEach((f, i) => {
    const description = `${f.kind === "pole" ? "Polo" : "Cero"} ${["", "simple", "doble", "triple"][f.multiplicity]}`;
    const identity = add(
      "Factores",
      `Identificá el factor ${f.frequency ? `asociado a s = −${f.frequency}` : "en el origen"}.`,
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
        ],
      },
    );
    identified.push({
      stage: identity,
      label: `Factor ${i + 1} · ${description}`,
      color: factorColors[i + 1],
    });
    if (f.frequency) {
      const corner = add(
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
      line(
        "mag",
        corner,
        `Quiebre del factor ${i + 1}`,
        factorColors[i + 1],
        "frequency",
        [[f.frequency, 0]],
      );
    }
    add(
      "Pendiente",
      `¿Qué pendiente aporta el factor ${i + 1} ${f.frequency ? "después del quiebre" : "en toda la banda"}?`,
      number(f.slope, "dB/década"),
      "Cada cero suma 20 y cada polo resta 20 dB/década.",
      "Multiplicá por el orden del factor.",
    );
    const w = f.frequency ? f.frequency * 10 : range[0];
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
      name(i),
      factorColors[i + 1],
      "factor",
      rows.map((r) => [r.omega, r.magnitudes[i]]),
    );
  });
  const initialMag = add(
    "Magnitud inicial",
    `Sumá los aportes de magnitud en ω = ${range[0]} rad/s.`,
    number(magPoints[0][1], "dB"),
    "Sumá la ganancia y el aporte de origen en dB.",
    "Este punto ancla el primer tramo de la suma.",
  );
  line("mag", initialMag, "Inicio de magnitud", "#f8e6ae", "marker", [
    magPoints[0],
  ]);
  const starts = [range[0], ...finite];
  starts.forEach((w, i) => {
    const end = starts[i + 1] ?? range[1];
    if (i > 0) {
      const index = factors.findIndex((f) => f.frequency === w);
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
        number(factors[index].slope, "dB/década"),
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
      magPoints.filter((p) => p[0] <= end),
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
    if (f.frequency) {
      stage = add(
        "Pendiente de fase",
        `¿Cuál es la pendiente del factor ${i + 1} durante su transición?`,
        number(f.phaseFinal / 2, "°/década"),
        "Dividí el cambio total de ángulo por las dos décadas que dura la transición.",
        "El signo indica si se acumula adelanto o atraso de fase.",
      );
    }
    line(
      "phase",
      stage,
      name(i),
      factorColors[i + 1],
      "factor",
      rows.map((r) => [r.omega, r.phases[i]!]),
    );
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
      i === 0 ? "marker" : final ? "total" : "partial",
      phasePoints.filter((p) => p[0] <= w),
    );
  });
  function margins(exact: boolean) {
    const origin = exact ? "exacto" : "por rectas";
    const gc = exact ? model.exactGainCrossings : crossings(magPoints, 0);
    const pc = exact ? model.exactPhaseCrossings : crossings(phasePoints, -180);
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
          "Con la convención habitual, la ausencia de cruce de fase implica MG infinito.",
          { choices: ["Ninguno", "Un cruce", "Dos cruces"] },
        );
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
          `El marcador señala la misma frecuencia en los dos gráficos.${direction ? " El cruce de magnitud es " + direction + "." : ""}`,
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
      });
    }
  }
  margins(false);
  const exactStage = add(
    "Modelo exacto",
    "¿Qué expresión permite contrastar las rectas con la transferencia exacta?",
    "G(jω)",
    "Evaluá sobre el eje imaginario.",
    "Evaluá 20 log₁₀|G(jω)| y sumá los argumentos de sus factores.",
    { choices: ["G(jω)", "G(ω)", "G(0)"] },
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
    "Si G=N/D es el lazo de una realimentación unitaria negativa, ¿cómo resulta el cierre al analizar D+N?",
    model.stability,
    "Usá el criterio de Routh sobre D+N para comprobarlo. Considerá el sentido de cada cruce.",
    model.interpretation,
    { choices: ["Estable", "Inestable", "Marginal"] },
  );
  return {
    id,
    page,
    formula: "G(s) = " + formula,
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
}

export const bodeExercises = models.map(build);
