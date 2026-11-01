import { expressionLatex } from './BlockFormula';

/** Frontend syntax checks only. The backend remains authoritative for algebra. */
export function prepareFormula(source: string, parameters: string[], allowK: boolean): string {
  if (!source.trim()) throw Error('Escribí una función de transferencia.');
  if (source.length > 2000) throw Error('La expresión supera los 2000 caracteres.');
  let text=source.replace(/²/g,'^2').replace(/³/g,'^3').replace(/−/g,'-').replace(/·/g,'*');
  text=text.replace(/\[[^\[\]]*\]/g, list=>{
    const values=list.slice(1,-1).split(',').map(x=>x.trim());
    if(!values.length || values.some(x=>!x || !Number.isFinite(Number(x)))) throw Error('La lista de coeficientes debe contener números finitos.');
    return '('+values.map((x,i)=>`(${x})*s^${values.length-i-1}`).join('+')+')';
  });
  const tokens=text.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|\*\*|[+*/()^\-]/g)||[];
  if(tokens.join('')!==text.replace(/\s/g,'')) throw Error('Hay caracteres no admitidos. Usá s, números, parámetros y +, −, *, /, ^.');
  let balance=0;
  for(const token of tokens){if(token==='(')balance++;if(token===')' && --balance<0)throw Error('Hay un paréntesis de cierre de más.');}
  if(balance>0)throw Error(`Falta cerrar ${balance} paréntesis con ')'.`);
  if(tokens.length>256)throw Error('La expresión es demasiado compleja.');
  const names=tokens.filter(x=>/^[A-Za-z_]/.test(x));
  for(const name of names){
    if(name==='s')continue;
    if(name==='K'){
      if(!allowK)throw Error('K se admite como factor inicial de G o GH, no en H.');
      if(tokens[0]!=='K' || names.filter(x=>x==='K').length!==1 || !['*','('].includes(tokens[1]))throw Error('Escribí K una sola vez como factor inicial: K*(...).');
    } else if(!parameters.includes(name)) throw Error(`Parámetro desconocido: ${name}. Agregalo a la lista de parámetros.`);
  }
  const out:string[]=[];
  for(const token of tokens){const last=out.at(-1);if(last && (last===')'||/^[\w.]/.test(last)) && (token==='('||/^[\w.]/.test(token)))out.push('*');out.push(token);}
  const normalized=out.join('');
  try{expressionLatex(normalized);}catch{throw Error('Expresión incompleta: revisá los operadores, las potencias y los paréntesis.');}
  return normalized;
}
