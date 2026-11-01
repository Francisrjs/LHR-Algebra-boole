/** Presentation only: model coefficients are computed and validated by Python. */
export function numberLatex(value: number): string {
  if (!Number.isFinite(value)) return "\\text{no definido}";
  if (value === 0) return "0";
  const text = Number(value.toPrecision(6)).toString();
  const [mantissa, exponent] = text.split("e");
  return exponent === undefined
    ? mantissa
    : `${mantissa}\\times 10^{${Number(exponent)}}`;
}
export function polynomialLatex(coefficients: number[]): string {
  const degree = coefficients.length - 1;
  const terms: string[] = [];
  coefficients.forEach((value, index) => {
    if (value === 0) return;
    const power = degree - index,
      absolute = Math.abs(value);
    const coefficient =
      power > 0 && absolute === 1 ? "" : numberLatex(absolute);
    const symbol = power === 0 ? "" : power === 1 ? "s" : `s^{${power}}`;
    const body = coefficient + symbol;
    terms.push((value < 0 ? "-" : terms.length ? "+" : "") + body);
  });
  return terms.join(" ") || "0";
}
export function transferLatex(
  num: number[],
  den: number[],
  label: string,
): string {
  return `${label}=\\frac{${polynomialLatex(num)}}{${polynomialLatex(den)}}`;
}
