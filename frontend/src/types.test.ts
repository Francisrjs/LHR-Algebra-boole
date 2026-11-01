import { describe, it, expect } from "vitest";
import { initial, validateProject } from "./types";
describe("proyectos portables", () => {
  it("conserva operandos algebraicos y zoom al exportar JSON", () => {
    const project = {
      ...initial,
      algebra: { operation: "parallel", functions: ["1/(s+3)", "1/(s+4)"] },
      charts: { "bode-chart": { xaxis: { range: [-2, 1], autorange: false } } },
    };
    const restored = JSON.parse(JSON.stringify(project));
    validateProject(restored);
    expect(restored.algebra).toEqual(project.algebra);
    expect(restored.charts).toEqual(project.charts);
  });
  it.each([
    { algebra: { operation: "exec", functions: ["1", "2"] } },
    { algebra: { operation: "series", functions: ["1"] } },
    { charts: { "bode-chart": { xaxis: { range: [1, 0] } } } },
    { charts: { "bode-chart": { xaxis: { range: [0, null] } } } },
  ])("rechaza configuración persistida inválida %j", (patch) => {
    expect(() => validateProject({ ...initial, ...patch })).toThrow();
  });
  it("acepta ida y vuelta JSON sin cambiar el modelo", () => {
    const project = JSON.parse(JSON.stringify(initial));
    expect(() => validateProject(project)).not.toThrow();
    expect(project).toEqual(initial);
  });
  it.each([
    { schemaVersion: 2 },
    { k: -1 },
    { k: null },
    { g: 23 },
    { frequency: { min: 0, max: 1, auto: false } },
    { parameters: [{ name: "K", value: 1, min: 0, max: 2, step: 1 }] },
    { parameters: [{ name: "a", value: 1, min: 3, max: 2, step: 1 }] },
    { history: [{}] },
  ])("rechaza importación inválida %j", (patch) => {
    expect(() => validateProject({ ...initial, ...patch })).toThrow();
  });
  it("permite guardar ambos modelos y parámetros de una expresión", () => {
    const project = {
      ...initial,
      parameters: [{ name: "wn", value: 2, min: 0.1, max: 10, step: 0.1 }],
      g: "wn^2/(s^2+wn*s+wn^2)",
    };
    expect(() => validateProject(project)).not.toThrow();
  });
});
