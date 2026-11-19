import RouthMath from "../RouthMath";

import { expressionLatex } from "../BlockFormula";

const powers = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function notation(value: string) {
  return value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]+/g, chars =>
    "^{" + [...chars].map(c => c === "ⁿ" ? "n" : c === "⁻" ? "-" : powers.indexOf(c)).join("") + "}")
    .replace(/[₀-₉]+/g, chars => "_{" + [...chars].map(c => c.charCodeAt(0) - 0x2080).join("") + "}")
    .replace(/−/g, "-").replace(/[×·*]/g, "\\cdot ").replace(/ω/g, "\\omega ")
    .replace(/Σ/g, "\\Sigma ").replace(/π|\bpi\b/gi, "\\pi ").replace(/\b(log|sin|cos|exp)/g, "\\$1 ");
}

function fraction(value: string): string {
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "/" && depth === 0) {
      const denominator = value.slice(i + 1).trim().replace(/^\[(.*)\]$/, "$1");
      return "\\frac{" + notation(value.slice(0, i)) + "}{" + notation(denominator) + "}";
    }
  }
  return notation(value);
}

export function TutorFormula({value}: {value: string}) {
  const latex = value.split(/,\s+/).map(eq => eq.split("=").map(fraction).join("=")).join(",\\quad ");
  return <RouthMath latex={latex}/>;
}

export function DraftFormula({value}: {value: string}) {
  const normalized = value.replace(/−/g, "-").replace(/[,]/g, ".").replace(/[·×]/g, "*");
  try {
    return <RouthMath latex={expressionLatex(normalized)}/>;
  } catch {
    // Preserve the entered grouping for functions and implicit multiplication.
    return <RouthMath latex={notation(normalized.replace(/\*\*/g, "^"))}/>;
  }
}

// Named expressions used inline in exercise prose.
const inline = /(G\/\(1\+GH\)|[A-Za-z]\([stω]\)\/[A-Za-z]\([stω]\)|[A-Za-z]\([stω]\)|\b[CRYEG]\/[RDNUs]\b|\b1\/s\b|[GHΣ][₀-₉]+|ω[₀-₉]*)/g;
export function TutorText({value}: {value: string}) {
  if (value.startsWith("G(s) = ")) return <TutorFormula value={value.replace(/\.$/, "")}/>;
  return <>{value.split(inline).map((part, i) =>
    i % 2 ? <TutorFormula key={i} value={part}/> : part)}</>;
}
