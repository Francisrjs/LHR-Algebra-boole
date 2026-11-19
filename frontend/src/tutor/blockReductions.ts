import { choose, expression, questions, type Question } from "./exercise";
import type { BlockExercise, Diagram, Edge, Node } from "./blocks";

type Branch =
  | string
  | { type: "series"; parts: Branch[] }
  | { type: "parallel" | "loop"; main: Branch; side: Branch; sign: "+" | "−" };
const series = (...parts: Branch[]): Branch => ({ type: "series", parts });
const parallel = (
  main: Branch,
  side: Branch,
  sign: "+" | "−" = "+",
): Branch => ({ type: "parallel", main, side, sign });
const loop = (
  main: Branch,
  side: Branch = "1",
  sign: "+" | "−" = "−",
): Branch => ({ type: "loop", main, side, sign });

// Draw each nested branch on its own row. Its return wire runs below its children.
function schematic(input: string, output: string, branch: Branch): Diagram {
  const nodes: Node[] = [],
    edges: Edge[] = [];
  function node(id: string, x: number, y: number, label?: string) {
    nodes.push([id, x, y, label]);
    return id;
  }
  function draw(
    part: Branch,
    x: number,
    y: number,
  ): { start: string; end: string; right: number; bottom: number } {
    if (typeof part === "string") {
      const block = node("Q" + (nodes.length + 1), x, y, part);
      return { start: block, end: block, right: x, bottom: y };
    }
    if (part.type === "series") {
      const first = draw(part.parts[0], x, y);
      let last = first,
        bottom = first.bottom;
      for (const child of part.parts.slice(1)) {
        const next = draw(child, last.right + 1, y);
        edges.push([
          last.end,
          next.start,
          next.start.startsWith("Σ") ? "+" : undefined,
        ]);
        bottom = Math.max(bottom, next.bottom);
        last = next;
      }
      return { ...last, start: first.start, bottom };
    }
    const feedback = part.type === "loop";
    const start = node((feedback ? "Σ" : ".") + (nodes.length + 1), x, y);
    const main = draw(part.main, x + 1, y);
    const row = main.bottom + 1;
    const sideNode = nodes.length,
      sideEdge = edges.length;
    const side = draw(part.side, x + 1, row);
    const right = Math.max(main.right, side.right) + 1;
    if (feedback) {
      const reflect = (col: number) => x + 1 + side.right - col;
      for (const n of nodes.slice(sideNode)) n[1] = reflect(n[1]);
      for (const e of edges.slice(sideEdge))
        for (const point of e[3] ?? []) point[0] = reflect(point[0]);
    }
    const end = node((feedback ? "." : "Σ") + (nodes.length + 1), right, y);
    edges.push(
      [start, main.start, main.start.startsWith("Σ") ? "+" : undefined],
      [main.end, end, feedback ? undefined : "+"],
    );
    if (feedback) {
      edges.push(
        [end, side.start, undefined, [[right, row]]],
        [side.end, start, part.sign, [[x, row]]],
      );
    } else {
      edges.push(
        [start, side.start, undefined, [[x, row]]],
        [side.end, end, part.sign, [[right, row]]],
      );
    }
    return { start, end, right, bottom: side.bottom };
  }
  node(input, 0, 0);
  const path = draw(branch, 1, 0);
  node(output, path.right + 1, 0);
  edges.push(
    [input, path.start, path.start.startsWith("Σ") ? "+" : undefined],
    [path.end, output],
  );
  return { nodes, edges };
}

const rules = {
  serie:
    "Multiplicá los bloques consecutivos cuando no haya una toma ni otra entrada entre ellos.",
  paralelo:
    "Las ramas tienen la misma entrada. Sumá o restá sus transferencias según el signo de llegada.",
  negativo: "Para un retorno negativo, el bloque equivalente es F/(1+F·H).",
  positivo: "Para un retorno positivo, el bloque equivalente es F/(1−F·H).",
  toma: "Al mover una toma hacia la salida de G, dividí la rama lateral por G. Al moverla hacia la entrada, multiplicala por G.",
  sumador:
    "Al llevar un sumador antes de G, dividí la entrada lateral por G. Al llevarlo después, multiplicala por G.",
  sumadores:
    "Podés separar, reunir o reordenar sumadores consecutivos conservando el signo de cada entrada.",
  conmutar:
    "Dos bloques escalares en serie pueden intercambiarse si no hay una derivación entre ellos.",
};
type Rule = keyof typeof rules;
export function reductionLesson(original: BlockExercise) {
  const items: Question[] = [];
  const transformed: { stage: number; title: string; diagram: Diagram }[] = [];
  let input = original.diagram.nodes[0][0];
  const output = original.diagram.nodes.some(([id]) => id === "Y") ? "Y" : "C";
  function snapshot(title: string, branch: Branch | Diagram) {
    transformed.push({
      stage: items.length - 1,
      title,
      diagram:
        typeof branch === "object" && "nodes" in branch
          ? branch
          : schematic(input, output, branch),
    });
  }
  function apply(
    rule: Rule,
    prompt: string,
    answer: string,
    after: Branch | Diagram,
  ) {
    items.push(
      expression(
        "Reducción · " + rule,
        prompt,
        answer,
        rules[rule],
        rules[rule],
      ),
    );
    snapshot(
      rule.charAt(0).toUpperCase() + rule.slice(1) + " · " + answer,
      after,
    );
  }
  function identify(
    prompt: string,
    options: string[],
    explanation: string,
    after?: Branch,
  ) {
    items.push(
      choose(
        "Elegir transformación",
        prompt,
        options,
        0,
        explanation,
        explanation,
      ),
    );
    if (after) snapshot(options[0], after);
  }
  function finish(rule: Rule, answer: string) {
    apply(
      rule,
      "Escribí el bloque equivalente " + output + "/" + input + ".",
      answer,
      answer,
    );
  }
  switch (original.id) {
    case "D1":
      identify(
        "¿Qué regla combina G1 y G2?",
        ["Paralelo con resta", "Serie", "Retorno positivo"],
        rules.paralelo,
      );
      finish("paralelo", "G1-G2");
      break;
    case "D2":
      identify(
        "¿Qué signo tiene el retorno G2?",
        ["Negativo", "Positivo"],
        rules.negativo,
      );
      finish("negativo", "G1/(1+G1*G2)");
      break;
    case "D3":
      identify(
        "¿Qué intercambio conserva la transferencia de esta cadena?",
        ["Intercambiar G1 y G2", "Intercambiar H y G1"],
        rules.conmutar,
        loop(series("G2", "G1", "G3"), "H"),
      );
      apply(
        "serie",
        "Agrupá los tres bloques de la trayectoria directa.",
        "G1*G2*G3",
        loop("G1*G2*G3", "H"),
      );
      finish("negativo", "G1*G2*G3/(1+H*G1*G2*G3)");
      break;
    case "D4":
      apply(
        "sumador",
        "Trasladá el primer sumador después de G2. ¿Qué ganancia necesita la rama directa de R?",
        "G2",
        parallel(parallel(series("G1", "G2"), "G2"), "1"),
      );
      apply(
        "serie",
        "Reducí G1 y G2 en la rama superior.",
        "G1*G2",
        parallel(parallel("G1*G2", "G2"), "1"),
      );
      apply(
        "paralelo",
        "Agrupá las primeras dos ramas.",
        "G1*G2+G2",
        parallel("G1*G2+G2", "1"),
      );
      finish("paralelo", "G1*G2+G2+1");
      break;
    case "D5":
      apply(
        "paralelo",
        "Agrupá las ramas directas G1 y G2.",
        "G1+G2",
        loop("G1+G2", parallel("G3", "G4", "−"), "+"),
      );
      apply(
        "paralelo",
        "Combiná las dos ramas de retorno respetando sus signos.",
        "G3-G4",
        loop("G1+G2", "G3-G4", "+"),
      );
      finish("positivo", "(G1+G2)/(1-(G1+G2)*(G3-G4))");
      break;
    case "D6":
    case "D15": {
      const h = "G*H1",
        f = "1/(1+G*H1)";
      apply(
        "toma",
        "Mové la toma de H1 desde la salida de G hasta su entrada. ¿Qué bloque queda en el retorno?",
        h,
        series(loop("1", h), parallel("G", "H2")),
      );
      apply(
        "paralelo",
        "Agrupá G y H2, que reciben la misma señal.",
        "G+H2",
        series(loop("1", h), "G+H2"),
      );
      apply(
        "negativo",
        "Reducí el lazo de trayectoria directa unitaria.",
        f,
        series(f, "G+H2"),
      );
      finish("serie", "(G+H2)/(1+G*H1)");
      break;
    }
    case "D7": {
      const h = "H2/G1",
        a = "G1*G2/(1-G1*G2*H1)",
        b = "G1*G2*G3/(1-G1*G2*H1+H2*G2*G3)";
      apply(
        "sumador",
        "Trasladá Σ3 antes de G1. ¿Qué compensación lleva H2?",
        h,
        original.transformed![0].diagram,
      );
      identify(
        "Reordená los dos sumadores contiguos. ¿Qué retorno queda en el lazo más interno?",
        ["H1 positivo", "H2 negativo"],
        rules.sumadores,
        loop(loop(series(loop(series("G1", "G2"), "H1", "+"), "G3"), h)),
      );
      apply(
        "serie",
        "Combiná G1 con G2.",
        "G1*G2",
        loop(loop(series(loop("G1*G2", "H1", "+"), "G3"), h)),
      );
      apply(
        "positivo",
        "Cerrá el retorno H1.",
        a,
        loop(loop(series(a, "G3"), h)),
      );
      apply(
        "serie",
        "Combiná ese lazo con G3.",
        a + "*G3",
        loop(loop(a + "*G3", h)),
      );
      apply("negativo", "Cerrá el retorno compensado H2/G1.", b, loop(b));
      finish("negativo", "G1*G2*G3/(1-G1*G2*H1+H2*G2*G3+G1*G2*G3)");
      break;
    }
    case "D8": {
      const f = "5/(s+2)",
        i = "1/s",
        g = "5*s/(s^2-18*s-5)";
      apply(
        "toma",
        "Llevá la toma de Y antes del integrador. ¿Qué bloque agregás en esa rama?",
        i,
        series(loop(f, parallel("4", i), "+"), i),
      );
      apply(
        "paralelo",
        "Reducí las dos ramas del retorno.",
        "4+1/s",
        series(loop(f, "4+1/s", "+"), i),
      );
      apply("positivo", "Cerrá el lazo positivo.", g, series(g, i));
      finish("serie", "5/(s^2-18*s-5)");
      break;
    }
    case "D9":
      identify(
        "Para calcular C/R, ¿qué entrada anulás?",
        ["D", "R"],
        "Aplicá superposición y conservá el retorno.",
        loop(series("G1", "G2"), "H1"),
      );
      apply(
        "serie",
        "Agrupá la trayectoria directa para C/R.",
        "G1*G2",
        loop("G1*G2", "H1"),
      );
      finish("negativo", "G1*G2/(1+G1*G2*H1)");
      input = "D";
      identify(
        "Volvé al original para C/D. Con R=0, ¿qué dos bloques quedan en el retorno negativo?",
        ["H1 y G1", "G1 y G2"],
        rules.serie,
        loop("G2", series("H1", "G1")),
      );
      apply(
        "serie",
        "Reducí la rama de retorno para C/D.",
        "G1*H1",
        loop("G2", "G1*H1"),
      );
      finish("negativo", "G2/(1+G1*G2*H1)");
      break;
    case "D10": {
      const a = "K1/(1+K1*H1)",
        b = "K2/(1-K2)",
        f = "(" + a + ")*(" + b + ")*K3";
      apply(
        "negativo",
        "Cerrá K1 con H1.",
        a,
        loop(series(a, loop("K2", "1", "+"), "K3")),
      );
      apply(
        "positivo",
        "Reducí K2 con retorno unitario positivo.",
        b,
        loop(series(a, b, "K3")),
      );
      apply(
        "serie",
        "Multiplicá los tres bloques de la trayectoria directa.",
        f,
        loop(f),
      );
      finish("negativo", "K1*K2*K3/((1+K1*H1)*(1-K2)+K1*K2*K3)");
      break;
    }
    case "D11": {
      const h = "K2/G3",
        a = "G4*G3/(1+K1*G4*G3)",
        b = "G1*G4*G3/(1+K1*G4*G3+G1*G4*K2)";
      apply(
        "toma",
        "Llevá la toma de K2 después de G3. ¿Qué bloque compensa el traslado?",
        h,
        loop(loop(series("G1", loop(series("G4", "G3"), "K1")), h), "G2"),
      );
      apply(
        "serie",
        "Agrupá G4 y G3.",
        "G4*G3",
        loop(loop(series("G1", loop("G4*G3", "K1")), h), "G2"),
      );
      apply(
        "negativo",
        "Cerrá el lazo con K1.",
        a,
        loop(loop(series("G1", a), h), "G2"),
      );
      apply(
        "serie",
        "Combiná G1 con ese equivalente.",
        "G1*(" + a + ")",
        loop(loop("G1*(" + a + ")", h), "G2"),
      );
      apply("negativo", "Cerrá el retorno K2/G3.", b, loop(b, "G2"));
      finish("negativo", "G1*G3*G4/(1+K1*G3*G4+G1*G4*K2+G1*G2*G3*G4)");
      items.push(...original.steps.slice(-2));
      break;
    }
    case "D12": {
      const b = "G2/(1-G2)",
        f = "G1*G2/(1-G2)";
      apply(
        "positivo",
        "Reducí G2 con su retorno unitario positivo.",
        b,
        loop(series("G1", b)),
      );
      apply("serie", "Combiná el equivalente con G1.", f, loop(f));
      finish("negativo", "G1*G2/(1-G2+G1*G2)");
      break;
    }
    case "D13": {
      const h = "K3+K4",
        f = "K2/s";
      identify(
        "Para C/R, anulá N. ¿Cómo reunís los dos sumadores de retorno?",
        ["Con las dos entradas negativas", "Con signos opuestos"],
        rules.sumadores,
        series("K1", loop(series("K2", "1/s"), parallel("K3", "K4"))),
      );
      apply(
        "paralelo",
        "Agrupá las ganancias del retorno común.",
        h,
        series("K1", loop(series("K2", "1/s"), h)),
      );
      apply("serie", "Agrupá K2 y el integrador.", f, series("K1", loop(f, h)));
      apply(
        "negativo",
        "Cerrá el lazo interior.",
        "K2/(s+K2*(K3+K4))",
        series("K1", "K2/(s+K2*(K3+K4))"),
      );
      finish("serie", "K1*K2/(s+K2*(K3+K4))");
      input = "N";
      identify(
        "Para C/N, anulá R. ¿Qué bloque queda en la trayectoria directa?",
        ["1/s", "K1", "K2"],
        "N entra justo antes del integrador.",
        loop("1/s", series(h, "K2")),
      );
      apply(
        "serie",
        "Reducí el retorno visto desde el integrador.",
        "K2*(K3+K4)",
        loop("1/s", "K2*(K3+K4)"),
      );
      finish("negativo", "1/(s+K2*(K3+K4))");
      items.push(...original.steps.slice(-3));
      break;
    }
    case "D14": {
      const a = "A/(1+A*B)",
        f = "A*D/(1+A*B)";
      identify(
        "Separá el sumador de tres entradas. ¿Qué retorno queda junto a A?",
        ["B negativo", "B positivo"],
        rules.sumadores,
        loop(series(loop("A", "B"), "D"), "1", "+"),
      );
      apply(
        "negativo",
        "Reducí A con el retorno B.",
        a,
        loop(series(a, "D"), "1", "+"),
      );
      apply("serie", "Multiplicá el equivalente por D.", f, loop(f, "1", "+"));
      finish("positivo", "A*D/(1+A*B-A*D)");
      break;
    }
    default:
      throw Error("Ejercicio de bloques sin reducción: " + original.id);
  }
  return { steps: questions(original.id + "-reduccion", items), transformed };
}
