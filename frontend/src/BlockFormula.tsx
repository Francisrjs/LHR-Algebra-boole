import katex from "katex";
import "katex/dist/katex.min.css";

// Restricted presentation parser; never evaluates the expression.
export function expressionLatex(source: string): string {
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|\*\*|[+*/()^-]/g) || [];
  if (tokens.join("") !== source.replace(/\s/g, "")) throw Error("Expresión no compatible");
  let i = 0;
  function atom(): string {
    const token = tokens[i++];
    if (token === "(" ) { const value = sum(); if(tokens[i++] !== ")") throw Error("Paréntesis"); return `\\left(${value}\\right)`; }
    if (token === "+" || token === "-") return token + atom();
    if (!token || !/^(?:[A-Za-z_]\w*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/.test(token)) throw Error("Símbolo");
    return token.replace(/_/g,"\\_");
  }
  function power(): string { let value=atom(); if(tokens[i]==="**" || tokens[i]==="^"){i++;value=`{${value}}^{${power()}}`;} return value; }
  function product(): string { let value=power(); while(tokens[i]==="*" || tokens[i]==="/"){const op=tokens[i++],right=power();value=op==="/"?`\\frac{${value}}{${right}}`:`${value} \\cdot ${right}`;} return value; }
  function sum(): string { let value=product();while(tokens[i]==="+" || tokens[i]==="-"){const op=tokens[i++];value+=` ${op} ${product()}`;}return value; }
  const result=sum();if(i!==tokens.length)throw Error("Expresión incompleta");return result;
}
export default function BlockFormula({expression, label, display=false}:{expression:string;label?:string;display?:boolean}) {
  try {
    const latex=(label?`${expressionLatex(label)} = `:"")+expressionLatex(expression);
    return <span className={`block-math ${display?"display":""}`} title={expression} dangerouslySetInnerHTML={{__html:katex.renderToString(latex,{throwOnError:true,trust:false,displayMode:display,output:"htmlAndMathml"})}} />;
  } catch { return <span className="block-math-fallback">{label?`${label} = `:""}{expression}</span>; }
}
