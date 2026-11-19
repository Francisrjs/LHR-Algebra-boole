import { describe, expect, it } from "vitest";
import { bodeExercises } from "./bode";
import { blockExercises, type Diagram } from "./blocks";
import { laplaceExercises } from "./laplace";
import { locusExercises, routhExercise } from "./locus";
import { manualValue } from "../bodeManual";
import { accepts, display, examStep, start, submit } from "./session";
import { equivalent, scalar } from "./expressions";

const all = [
  ...bodeExercises,
  ...locusExercises,
  routhExercise,
  ...blockExercises,
  ...laplaceExercises,
];

describe("tutor", () => {
  it("includes exactly the 33 originals and accepts their reference answers", () => {
    expect(new Set(all.map((e) => e.id)).size).toBe(33);
    expect(all).toHaveLength(33);
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

  it("checks each original block equivalent against the diagram's own signal equations", () => {
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
      for (const step of exercise.steps.filter(
        (s) => s.concept === "Equivalente",
      )) {
        const match = step.prompt.match(/([CY])\/([RDNU])/)!;
        const actual = solve(exercise.diagram, match[2], match[1], value);
        expect(actual, step.id).toBeCloseTo(value(step.answer as string), 9);
      }
    }
    const d15 = blockExercises.at(-1)!;
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
