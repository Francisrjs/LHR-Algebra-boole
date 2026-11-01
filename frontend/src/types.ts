export type BodeFactor = {
 id:string; label:string; latex:string; kind:'pole'|'zero'; multiplicity:number;
 frequency:number; order:number; slope:number; phaseFinal:number|null; phaseAvailable:boolean;
 transition:[number,number]|null; magnitude:(number|null)[]; phase:(number|null)[];
 marker:number|null; markerPhase:number|null; root:Root;
};
export type BodeDecomposition = {
 latex?:string; gain?:number; gainDb?:number|null; gainPhase?:number|null;
 gainMagnitude?:(number|null)[]; gainPhases?:(number|null)[];
 factors:BodeFactor[]; segments:{start:number;end:number|null;slope:number}[];
 reconstructionError?:number; warning:string;
};
export type Root = { re: number; im: number };
export type Model = {
  num: number[];
  den: number[];
  expression: string;
  poles: Root[];
  zeros: Root[];
};
export type Parameter = {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
};
export type Project = {
  blockDiagram?: { schemaVersion: 1; nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> };
  algebra?: { operation: string; functions: string[] };
  charts?: Record<string, ChartView>;
  format: "controllab";
  schemaVersion: 1;
  mode: "separate" | "direct";
  g: string;
  h: string;
  l: string;
  k: number;
  parameters: Parameter[];
  target: "g" | "h" | "l" | "t";
  temporalTarget?: "g" | "h" | "l" | "t";
  view: string;
  frequency: { min: number; max: number; auto: boolean };
  temporal: { signal: string; duration: number; amplitude: number };
  asymptotic: boolean;
  factorLines?: boolean;
  factorMarks?: boolean;
  history: string[];
};
export type ChartView = Partial<
  Record<
    "xaxis" | "yaxis" | "xaxis2" | "yaxis2",
    { range?: number[]; autorange?: boolean }
  >
>;
export type Analysis = {
  revision: number;
  models: {
    l0: Model;
    g: Model | null;
    h: Model | null;
    l: Model;
    t: Model | null;
  };
  stability: string;
  selectedStability?: string;
  baseStability?: string;
  warnings: string[];
  bode: {
    decomposition?: BodeDecomposition;
    omega: number[];
    magnitude: (number | null)[];
    phase: (number | null)[];
    asymMagnitude: (number | null)[];
    asymPhase: (number | null)[];
    breaks: number[];
    margins: {
      gm: number | null;
      pm: number | null;
      wgc: number | null;
      wpc: number | null;
      gmState: string;
      pmState: string;
      all: { kind: string; omega: number; margin: number }[];
    };
  };
  locus: {
    range: { x: number[]; y: number[] };
    asymptotes: { x: number[]; y: number[] }[];
    segments: { min: number; max: number }[];
    branches: { x: number[]; y: number[] }[];
    openPoles: Root[];
    zeros: Root[];
    closedPoles: Root[];
    centroid: number | null;
    angles: number[];
    breakaways: Root[];
    crossings: { omega: number; k: number }[];
    error?: string;
  };
  temporal: {
    time?: number[];
    input?: number[];
    output?: number[];
    metrics?: Record<string, number | null>;
    impulseWeight?: number;
    error?: string;
  };
};
export const initial: Project = {
  format: "controllab",
  schemaVersion: 1,
  mode: "separate",
  g: "1/(s*(s+1)*(s+3))",
  h: "1",
  l: "1/(s*(s+1)*(s+3))",
  k: 1,
  parameters: [],
  target: "l",
  view: "bode",
  frequency: { min: 0.01, max: 1000, auto: true },
  temporal: { signal: "step", duration: 15, amplitude: 1 },
  asymptotic: false,
  history: [],
  algebra: { operation: "series", functions: ["1/(s+1)", "1/(s+2)"] },
  charts: {},
};
export function validateProject(v: unknown): asserts v is Project {
  const p = v as Project;
  if (
    !p ||
    p.format !== "controllab" ||
    p.schemaVersion !== 1 ||
    !["separate", "direct"].includes(p.mode) ||
    !["g", "h", "l", "t"].includes(p.target) ||
    !["bode", "lgr", "plano", "temporal", "algebra"].includes(p.view) ||
    ![p.g, p.h, p.l].every((x) => typeof x === "string") ||
    !Number.isFinite(p.k) ||
    p.k < 0 ||
    !Array.isArray(p.parameters) ||
    !p.parameters.every(
      (x) =>
        typeof x.name === "string" &&
        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(x.name) &&
        x.name !== "s" &&
        x.name !== "K" &&
        [x.value, x.min, x.max, x.step].every(Number.isFinite) &&
        x.max > x.min &&
        x.step > 0,
    ) ||
    !p.frequency ||
    !(p.frequency.min > 0 && p.frequency.max > p.frequency.min) ||
    typeof p.frequency.auto !== "boolean" ||
    !p.temporal ||
    !["step", "ramp", "impulse"].includes(p.temporal.signal) ||
    !(p.temporal.duration > 0) ||
    !Number.isFinite(p.temporal.amplitude) ||
    typeof p.asymptotic !== "boolean" ||
    (p.factorLines !== undefined && typeof p.factorLines !== "boolean") ||
    (p.factorMarks !== undefined && typeof p.factorMarks !== "boolean") ||
    !Array.isArray(p.history) ||
    !p.history.every((x) => typeof x === "string") ||
    (p.algebra !== undefined &&
      (!p.algebra ||
        !["series", "parallel", "subtract", "feedback"].includes(
          p.algebra.operation,
        ) ||
        !Array.isArray(p.algebra.functions) ||
        p.algebra.functions.length < 2 ||
        !p.algebra.functions.every((x) => typeof x === "string"))) ||
    (p.blockDiagram !== undefined &&
      (!p.blockDiagram || p.blockDiagram.schemaVersion !== 1 ||
        !Array.isArray(p.blockDiagram.nodes) || !Array.isArray(p.blockDiagram.edges))) ||
    (p.charts !== undefined &&
      (!p.charts ||
        typeof p.charts !== "object" ||
        Array.isArray(p.charts) ||
        !Object.entries(p.charts).every(
          ([key, view]) =>
            [
              "bode-chart",
              "lgr-chart",
              "plano-chart",
              "temporal-chart",
            ].includes(key) &&
            view &&
            typeof view === "object" &&
            Object.entries(view).every(
              ([axis, options]) =>
                ["xaxis", "yaxis", "xaxis2", "yaxis2"].includes(axis) &&
                options &&
                typeof options === "object" &&
                (options.autorange === undefined ||
                  typeof options.autorange === "boolean") &&
                (options.range === undefined ||
                  (Array.isArray(options.range) &&
                    options.range.length === 2 &&
                    options.range.every(Number.isFinite) &&
                    options.range[1] > options.range[0])),
            ),
        )))
  )
    throw Error("El archivo no es un proyecto ControlLab válido.");
}
