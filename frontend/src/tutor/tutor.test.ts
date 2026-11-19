import { describe, expect, it } from "vitest";
import { bodeExercises } from "./bode";
import { blockReductions, blockExercises, type Diagram } from "./blocks";
import { laplaceExercises } from "./laplace";
import { guidedLocusExercises, locusExercises, routhCells, routhExercise } from "./locus";
import { manualValue } from "../bodeManual";
import { accepts, display, examStep, start, submit } from "./session";
import { equivalent, scalar } from "./expressions";
import type { Exercise } from "./exercise";

const all: Exercise[] = [
  ...bodeExercises,
  ...locusExercises,
  routhExercise,
  ...blockExercises,
  ...laplaceExercises,
];

describe("tutor", () => {
  it("preserves the original catalog and accepts the answers across its 54 exercises", () => {
    const originalIds = [["B", 6], ["L", 6], ["D", 15], ["E", 6]] as const;
    expect(all.filter((e) => !e.partial).map((e) => e.id).sort()).toEqual([
      "R1", ...originalIds.flatMap(([prefix, count]) =>
        Array.from({ length: count }, (_, i) => prefix + (i + 1))),
    ].sort());
    expect(new Set(all.map((e) => e.id)).size).toBe(54);
    expect(all).toHaveLength(54);
    for (const exercise of all) {
      expect(exercise.page).toBeTruthy();
      let attempt = start(exercise.id, "Intermedio");
      for (const step of exercise.steps) {
        expect(accepts(step, display(step.answer)), step.id).toBe(true);
        attempt = submit(attempt, exercise.steps, display(step.answer));
      }
      expect(attempt.complete, exercise.id).toBe(true);
    }
  });

  it("reveals B2 corner symbols and slopes at their own steps", () => {
    const b2 = bodeExercises[1];
    const labels = (concept: string) => b2.layers.mag
      .filter(([stage]) => b2.steps[stage].concept === concept)
      .map(([, layer]) => layer.label);
    expect(labels("Factores")).toContain("× Polo doble · 1 rad/s");
    expect(labels("Factores")).toContain("○ Cero simple · 10 rad/s");
    expect(labels("Factores").join(" ")).toContain("-40 dB/década");
    expect(labels("Factores").join(" ")).toContain("+20 dB/década");
  });

  it("sums the seven guide frequencies in the complex-zero example", () => {
    const example = bodeExercises.find(e => e.id === "B6")!;
    const values = [0.01,0.1,1,10,100,1000,10000].map(w => manualValue(example.decomposition,w));
    expect(values.map(v => v.phase)).toEqual([-90,-90,-45,-45,-135,-225,-270]);
    expect(values.map(v => v.magnitude)).toEqual([60,40,20,20,0,-40,-100]);
  });

  it("handles units, decimal commas, equivalent expressions and unknown symbols", () => {
    const frequency = bodeExercises[0].steps.find(
      (s) => s.pick === "frequency",
    )!;
    expect(accepts(frequency, "100 rad/s")).toBe(true);
    expect(accepts(frequency, "15,91549 Hz")).toBe(true);
    expect(accepts(frequency, "100 dB")).toBe(false);
    expect(accepts(frequency, "−100")).toBe(false);
    expect(scalar("√(3)/2")).toBeCloseTo(Math.sqrt(3) / 2);
    expect(equivalent("e^(-t)*(100t)", "100t*exp(-t)")).toBe(true);
    expect(equivalent("5(1-exp(-t))^2", "5-10exp(-t)+5exp(-2t)")).toBe(true);
    expect(equivalent("1/(s^2+2s+1)", "1/(s+1)^2")).toBe(true);
    expect(equivalent("1/(s^2-2s+1)", "1/(s+1)^2")).toBe(false);
    expect(equivalent("globalThis.alert(1)", "1")).toBe(false);
  });

  it("keeps wrong attempts on the same step and defers exam corrections", () => {
    const steps = bodeExercises[0].steps;
    const practice = submit(start("B1", "Intermedio"), steps, "100");
    expect(practice.step).toBe(0);
    expect(practice.log[0].outcome).toBe("wrong");
    expect(submit(practice, steps, "10^5/(100*1000)").step).toBe(1);
    let exam = start("B1", "Examen");
    for (let i = 0; i < steps.length; i++) exam = submit(exam, steps, "100");
    expect(exam.log.every((entry) => entry.outcome === "exam")).toBe(true);
    expect(exam.complete).toBe(false);
    expect(submit(exam, steps, "100")).toBe(exam);
    const idx = steps.findIndex((s) => s.examPrompt);
    const derived = examStep(steps, idx, [
      { step: idx - 1, response: "10 rad/s", outcome: "exam" },
    ]);
    expect(accepts(derived, "−90°")).toBe(true);
  });

  it("uses the manual B1 anchors and exact finite crossings only where applicable", () => {
    const [b1, b2, b3, b4, b5] = bodeExercises;
    expect(manualValue(b1.decomposition, 0.01)).toMatchObject({
      magnitude: 40,
      slope: -20,
      phase: -90,
    });
    expect(manualValue(b1.decomposition, 100)).toMatchObject({
      magnitude: -40,
      slope: -40,
      phase: -135,
    });
    expect(manualValue(b1.decomposition, 1000)).toMatchObject({
      magnitude: -80,
      slope: -60,
      phase: -225,
    });
    const finite = (exercise: typeof b1, quantity: string) =>
      exercise.steps.filter((s) =>
        s.prompt.includes("encuentro exacto con " + quantity),
      );
    expect(finite(b1, "−180°")[0].answer).toMatchObject({
      value: Math.sqrt(1e5),
    });
    expect(finite(b2, "0 dB")).toHaveLength(2);
    expect(finite(b2, "−180°")).toHaveLength(0);
    expect(finite(b3, "−180°")).toHaveLength(0);
    expect(finite(b4, "−180°")).toHaveLength(1);
    expect(manualValue(b4.decomposition, 0.01).phase).toBe(-270);
    expect(finite(b5, "0 dB")).toHaveLength(2);
    expect(finite(b5, "−180°")).toHaveLength(0);
  });

  it("grades the guided LGR choices and aligns each Routh cell and crossing", () => {
    for (const ex of guidedLocusExercises) {
      expect(ex.steps.filter(s => s.concept === "Derivar D")).toHaveLength(1);
      for (const s of ex.steps) {
        expect(accepts(s,display(s.answer)),s.id).toBe(true);
        if (s.choices) expect(s.choices.filter(v => accepts(s,v)),s.id).toHaveLength(1);
      }
      for (const cell of routhCells(ex)) expect(ex.steps[cell.stage].answer).toBe(cell.label);
      for (const l of ex.layers.filter(l => l.kind === "crossing")) expect(ex.steps[l.stage].concept).toBe("Cruce imaginario");
    }
    expect(guidedLocusExercises.find(e=>e.id==="L5")!.steps.find(s=>s.concept==="Ganancia de ruptura")?.answer).toBe("0,6311");
  });

  it("keeps the L5 centroid, critical gain and crossing in different stages", () => {
    const l5 = locusExercises.find((e) => e.id === "L5")!;
    const center = l5.layers.find((l) => l.kind === "center")!;
    const cross = l5.layers.find((l) => l.kind === "crossing")!;
    const critical = l5.steps.findIndex(
      (s) => s.concept === "Ganancia crítica",
    );
    expect(center.values[0]).toBeCloseTo(-4 / 3);
    expect(l5.steps[critical].answer).toMatchObject({ value: 12 });
    expect(cross.values[0]).toBeCloseTo(Math.sqrt(3));
    expect(center.stage).toBeLessThan(critical);
    expect(critical).toBeLessThan(cross.stage);
  });

  it("checks each block equivalent against the diagram's own signal equations", () => {
    const vars = {
      s: 2.73,
      g1: 0.21,
      g2: 0.48,
      g3: 0.73,
      g4: 0.17,
      h: 0.34,
      h1: 0.33,
      h2: 0.52,
      k1: 0.26,
      k2: 0.59,
      k3: 0.37,
      k4: 0.43,
      g: 0.67,
      a: 0.11,
      b: 0.31,
      d: 0.2,
    };
    function value(expression: string) {
      return scalar(
        expression.toLowerCase().replace(/[a-z]\d*/g, (key) => {
          const sample = vars[key as keyof typeof vars];
          return sample === undefined ? key : "(" + sample + ")";
        }),
      );
    }
    for (const exercise of blockExercises) {
      const reduction = blockReductions[exercise.id];
      for (const {diagram, stage} of (reduction?.transformed ?? exercise.transformed ?? [])) {
        const input = diagram.nodes[0][0];
        const output = diagram.nodes.some(([id]) => id === "Y") ? "Y" : "C";
        expect(solve(diagram,input,output,value), exercise.id+" paso "+stage)
          .toBeCloseTo(solve(exercise.diagram,input,output,value),8);
      }
      for (const step of reduction?.steps ?? []) expect(accepts(step,display(step.answer)),step.id).toBe(true);
      for (const step of exercise.steps.filter(
        (s) => s.concept === "Equivalente",
      )) {
        const match = step.prompt.match(/([CY])\/([RDNU])/)!;
        const actual = solve(exercise.diagram, match[2], match[1], value);
        expect(actual, step.id).toBeCloseTo(value(step.answer as string), 9);
      }
    }
    const d15 = blockExercises.find((e) => e.id === "D15")!;
    const invalid = {
      ...d15.diagram,
      edges: d15.diagram.edges.map((e) =>
        e[0] === ".x" && e[1] === "H1"
          ? (["C", e[1], e[2], e[3]] as typeof e)
          : e,
      ),
    };
    expect(solve(invalid, "R", "C", value)).not.toBeCloseTo(
      value(d15.steps.at(-1)!.answer as string),
      6,
    );
    const d10 = blockExercises.find((e) => e.id === "D10")!;
    const wrongSign = {
      ...d10.diagram,
      edges: d10.diagram.edges.map((e) =>
        e[0] === ".c" && e[1] === "Σ1"
          ? ([e[0], e[1], "+", e[3]] as typeof e)
          : e,
      ),
    };
    expect(solve(wrongSign, "R", "C", value)).not.toBeCloseTo(
      value(d10.steps.at(-1)!.answer as string),
      6,
    );
  });

  it("detects a sign change and a wrong takeoff in partial block diagrams", () => {
    const at = (expression: string) => scalar(expression.replace(/s/g, "(2.73)"));
    const p12 = blockExercises.find((e) => e.id === "P1.2")!.diagram;
    const p15 = blockExercises.find((e) => e.id === "P1.5")!.diagram;
    const reversed: Diagram = { ...p12, edges: p12.edges.map(([from, to, sign, via]) =>
      [from, to, from === ".X" && to === "Σ2" ? "−" : sign, via]) };
    const moved: Diagram = { ...p15, edges: p15.edges.map(([from, to, sign, via]) =>
      [from === ".Y" && to === "Σ3" ? ".X" : from, to, sign, via]) };
    for (const [original, invalid] of [[p12, reversed], [p15, moved]]) {
      expect(solve(invalid, "R", "C", at)).not.toBeCloseTo(solve(original, "R", "C", at), 5);
    }
  });

  it("checks both stationary errors with the comparator convention", () => {
    const p25 = laplaceExercises.find((e) => e.id === "P2.5")!;
    const [tracking, comparator] = p25.steps.slice(-2);
    expect(accepts(tracking, "-2")).toBe(true);
    expect(accepts(tracking, "2")).toBe(false);
    expect(accepts(comparator, "+2")).toBe(true);
    expect(accepts(comparator, "1,2")).toBe(false);
  });

  it("compares signed exact Bode margins with the handout references", () => {
    const values = [[54.90, 21.74], [-19.34, -13.56], [-21.88, 21.88], [-62.87, -34.07], [19.99]];
    values.forEach((expected, index) => {
      const exercise = bodeExercises.find((e) => e.id === "P3." + (index + 1))!;
      const exactStart = exercise.steps.findIndex((step) => step.concept === "Modelo exacto");
      const margins = exercise.steps.slice(exactStart).filter((step) =>
        step.concept === "Márgenes" && typeof step.answer === "object");
      expect(margins).toHaveLength(expected.length);
      margins.forEach((step, i) => {
        expect(accepts(step, String(expected[i])), step.id).toBe(true);
        expect(accepts(step, String(expected[i] + 0.3)), step.id).toBe(false);
      });
    });
    const p33 = bodeExercises.find((e) => e.id === "P3.3")!;
    const directions = p33.steps.filter((step) => step.concept === "Sentido del cruce");
    expect(directions.map((step) => step.answer)).toEqual(["Ascendente", "Descendente"]);
    const p35 = bodeExercises.find((e) => e.id === "P3.5")!;
    const [magnitude, phase] = (["mag", "phase"] as const).map((axis) => {
      const curve = p35.layers[axis].find(([, layer]) => layer.style === "exact")![1];
      return curve.points.find(([omega]) => Math.abs(omega - 1) < 1e-12) ??
        curve.points.reduce((nearest, point) =>
          Math.abs(point[0] - 1) < Math.abs(nearest[0] - 1) ? point : nearest);
    });
    const [omega, mag] = magnitude;
    const gain = 10 * Math.hypot(1 - omega ** 2, omega) /
      (omega * Math.hypot(1, omega / 10) * Math.hypot(1, omega / 100) * Math.hypot(1, omega / 1000));
    expect(mag).toBeCloseTo(20 * Math.log10(gain), 9);
    const [w, angle] = phase;
    expect(angle).toBeCloseTo((Math.atan2(w, 1 - w ** 2) - Math.PI / 2 -
      Math.atan(w / 10) - Math.atan(w / 100) - Math.atan(w / 1000)) * 180 / Math.PI, 9);
  });
});

function solve(
  diagram: Diagram,
  input: string,
  output: string,
  value: (expression: string) => number,
) {
  const index = new Map(diagram.nodes.map(([id], i) => [id, i]));
  const n = diagram.nodes.length;
  const matrix: number[][] = diagram.nodes.map(([id], i) =>
    Array.from({ length: n + 1 }, (_, j) =>
      j === i || (j === n && id === input) ? 1 : 0,
    ),
  );
  for (const [source, target, sign] of diagram.edges) {
    const i = index.get(target)!;
    const [id, , , label] = diagram.nodes[i];
    const gain =
      id.startsWith(".") || id.startsWith("Σ") || ["Y", "C"].includes(id)
        ? 1
        : value(label ?? id);
    matrix[i][index.get(source)!] -= gain * (sign === "−" ? -1 : 1);
  }
  for (let i = 0; i < n; i++) {
    const row = matrix.findIndex((r, j) => j >= i && Math.abs(r[i]) > 1e-10);
    [matrix[i], matrix[row]] = [matrix[row], matrix[i]];
    const divisor = matrix[i][i];
    matrix[i] = matrix[i].map((v) => v / divisor);
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const k = matrix[j][i];
      matrix[j] = matrix[j].map((v, c) => v - k * matrix[i][c]);
    }
  }
  return matrix[index.get(output)!][n];
}
