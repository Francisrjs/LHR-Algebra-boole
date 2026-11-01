import { describe, it, expect } from "vitest";
import { numberLatex, polynomialLatex, transferLatex } from "./math";
describe("presentación de polinomios", () => {
  it("representa cero y descarta términos nulos", () => {
    expect(polynomialLatex([0, 0, 0])).toBe("0");
    expect(polynomialLatex([1, 0, 2])).toBe("s^{2} +2");
  });
  it("respeta signos, constantes y coeficientes unitarios", () => {
    expect(polynomialLatex([-1, 1, -2])).toBe("-s^{2} +s -2");
    expect(polynomialLatex([-1])).toBe("-1");
  });
  it("muestra notación científica como potencia decimal", () => {
    expect(numberLatex(1e-9)).toBe("1\\times 10^{-9}");
    expect(numberLatex(1e21)).toBe("1\\times 10^{21}");
  });
  it("limita presentación a seis cifras sin alterar datos", () => {
    const values = [1.23456789, 1];
    expect(polynomialLatex(values)).toBe("1.23457s +1");
    expect(values[0]).toBe(1.23456789);
  });
  it("forma fracciones verdaderas con exponentes", () => {
    expect(transferLatex([1], [1, 3, 2], "G_0(s)")).toBe(
      "G_0(s)=\\frac{1}{s^{2} +3s +2}",
    );
  });
  it("no produce NaN para números no finitos", () => {
    expect(numberLatex(Infinity)).toBe("\\text{no definido}");
  });
});
