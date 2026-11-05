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
      if(!allowK)throw Error('K se admite como factor externo de G o GH, no en H.');
      if(names.filter(x=>x==='K').length!==1)throw Error('Usá K una sola vez como factor multiplicativo externo.');
    } else if(!parameters.includes(name)) throw Error(`Parámetro desconocido: ${name}. Agregalo a la lista de parámetros.`);
  }
  const out:string[]=[];
  for(const token of tokens){const last=out.at(-1);if(last && (last===')'||/^[\w.]/.test(last)) && (token==='('||/^[\w.]/.test(token)))out.push('*');out.push(token);}
  const normalized=out.join('');
  try{expressionLatex(normalized);}catch{throw Error('Expresión incompleta: revisá los operadores, las potencias y los paréntesis.');}
  if(names.includes('K')) {
    let i=0;
    const fail=()=>{throw Error('Usá K como factor externo: K*G(s) o G(s)*K, fuera de sumas, potencias y denominadores.');};
    function atom():boolean {
      const token=out[i++];
      if(token==='('){const has=sum();if(out[i++]!==')')return fail();return has;}
      if(token==='+'||token==='-')return atom();
      return token==='K';
    }
    function power():boolean {const has=atom();if(out[i]==='^'||out[i]==='**'){i++;const rhs=power();if(has||rhs)fail();}return has;}
    function product():boolean {let has=power();while(out[i]==='*'||out[i]==='/'){const op=out[i++],rhs=power();if(op==='/'&&rhs)fail();has=has||rhs;}return has;}
    function sum():boolean {let has=product();while(out[i]==='+'||out[i]==='-'){i++;const rhs=product();if(has||rhs)fail();has=has||rhs;}return has;}
    sum();
  }
  return normalized;
}
