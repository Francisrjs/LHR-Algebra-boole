const superscripts: Record<string, string> = Object.fromEntries(
  [..."⁰¹²³⁴⁵⁶⁷⁸⁹⁻"].map((s, i) => [s, "0123456789-"[i]]),
);
const subscripts: Record<string, string> = Object.fromEntries(
  [..."₀₁₂₃₄₅₆₇₈₉"].map((s, i) => [s, String(i)]),
);
const functions: Record<string, (value: number) => number> = {
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  sqrt: Math.sqrt,
  log10: Math.log10,
};

function tokens(text: string) {
  const source = text
    .toLowerCase()
    .replace(/sen/g, "sin")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/√\s*(\d+(?:[.,]\d+)?)/g, "sqrt($1)")
    .replace(/[−–]/g, "-")
    .replace(/[·×]/g, "*")
    .replace(/\*\*/g, "^")
    .replace(
      /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,
      (part) => "^(" + [...part].map((ch) => superscripts[ch]).join("") + ")",
    )
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => subscripts[ch])
    .replace(/[\[{]/g, "(")
    .replace(/[\]}]/g, ")")
    .replace(/(?<=\d),(?=\d)/g, ".")
    .replace(/\s+/g, "");
  if (source.length > 240) throw Error("Expresión demasiado larga");
  const result =
    source.match(
      /(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|sqrt|log10|exp|sin|cos|pi|[a-z]\d*|[()+\-*/^]/g,
    ) ?? [];
  if (result.join("") !== source) throw Error("Símbolo desconocido");
  return result;
}

function compile(text: string) {
  const input = tokens(text);
  const names = new Set<string>();
  type Vars = Record<string, number>;
  type Evaluate = (vars: Vars) => number;
  let i = 0;

  function atom(): Evaluate {
    const token = input[i++];
    if (token === "(") {
      const value = sum();
      if (input[i++] !== ")") throw Error("Falta cerrar paréntesis");
      return value;
    }
    if (/^(?:\d|\.)/.test(token ?? "")) return () => Number(token);
    if (Object.hasOwn(functions, token)) {
      if (input[i] !== "(") throw Error("Falta argumento");
      const value = atom();
      return (vars) => functions[token](value(vars));
    }
    if (token === "e") return () => Math.E;
    if (token === "pi") return () => Math.PI;
    if (!/^[a-z]\d*$/.test(token ?? "")) throw Error("Falta un término");
    names.add(token);
    return (vars) => vars[token];
  }

  function signed(): Evaluate {
    if (input[i] === "+" || input[i] === "-") {
      const sign = input[i++] === "-" ? -1 : 1;
      const value = signed();
      return (vars) => sign * value(vars);
    }
    const base = atom();
    if (input[i] !== "^") return base;
    i++;
    const power = signed();
    return (vars) => base(vars) ** power(vars);
  }

  function product(): Evaluate {
    let value = signed();
    while (/^(?:[*/(.a-z]|\d)/.test(input[i] ?? "")) {
      const op = input[i];
      if (op === "*" || op === "/") i++;
      const first = value;
      const second = signed();
      value = (vars) =>
        op === "/" ? first(vars) / second(vars) : first(vars) * second(vars);
    }
    return value;
  }

  function sum(): Evaluate {
    let value = product();
    while (input[i] === "+" || input[i] === "-") {
      const sign = input[i++] === "-" ? -1 : 1;
      const first = value;
      const second = product();
      value = (vars) => first(vars) + sign * second(vars);
    }
    return value;
  }

  const evaluate = sum();
  if (i !== input.length) throw Error("Expresión incompleta");
  return { evaluate, names };
}

export function expressionError(source: string) {
  try { compile(source); return ""; }
  catch (error) { return error instanceof Error ? error.message : "Expresión incompleta"; }
}

export function scalar(source: string) {
  try {
    const { names, evaluate } = compile(source);
    return names.size ? NaN : evaluate({});
  } catch {
    return NaN;
  }
}

export function equivalent(source: string, target: string) {
  try {
    const actual = compile(source);
    const expected = compile(target);
    if ([...actual.names].some((name) => !expected.names.has(name)))
      return false;
    const points = [
      -2.731, -1.143, -0.473, 0.219, 0.691, 1.367, 2.389, 3.791, 6.147,
    ];
    let checked = 0;
    for (const [i, point] of points.entries()) {
      const vars = Object.fromEntries(
        [...expected.names].map((name, j) => [
          name,
          point + 0.317 * j * (1 + (i % 3)),
        ]),
      );
      const left = actual.evaluate(vars),
        right = expected.evaluate(vars);
      if (!Number.isFinite(right)) continue;
      if (
        !Number.isFinite(left) ||
        Math.abs(left - right) > 1e-8 * Math.max(1, Math.abs(right))
      )
        return false;
      checked++;
    }
    return checked >= 5;
  } catch {
    return false;
  }
}
