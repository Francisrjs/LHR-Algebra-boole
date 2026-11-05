import examples from './routhExamples.json';
import {useEffect,useId,useState,type CSSProperties} from 'react';
import BlockFormula from './BlockFormula';
import RouthMath from './RouthMath';
import './routh.css';

type Input={source:string;expression:string;k:number};
type Cell={id:string;value:string;latex:string;kind:string;refs:string[];steps:string[];stepsLatex:string[]};
type Result={symbolicRows:Cell[][]|null;symbolicDegree:number;characteristicLatex:string;evaluatedLatex:string;intervalLatex:string|null;degree:number;rows:Cell[][];status:'stable'|'unstable'|'boundary';changes:number;signs:number[];critical:number[];events:string[]};
export const defaultRouth:Input={source:'polynomial',expression:'s^3+2*s^2+3*s+K',k:10};
const labels:Record<string,string>={'degree-change':'Cambio de grado en K crítico',stable:'Estable · polos repetidos izquierdos',rhp:'Inestable · polos derechos',boundary:'Frontera · imaginarios simples','repeated-axis':'Imaginarios repetidos',mixed:'Repetición estable y eje simple',epsilon:'Pivote cero · epsilon','zero-row':'Fila nula · raíces simétricas',origin:'Raíz simple en el origen',negative:'Coeficiente principal negativo',gain:'Intervalo de ganancia K','repeated-origin':'Origen repetido',constant:'Constante · sin polos'};
const palette=['#e9b45e','#6ebce6','#c99ae8','#6ad5b2'];
const statusLabel={stable:'Estable',unstable:'Inestable',boundary:'Frontera de estabilidad'};
const explanations:Record<string,string>={coefficient:'Este valor se toma del coeficiente correspondiente del polinomio. Las dos primeras filas alternan sus potencias.',padding:'No hay otro coeficiente en esta posición. Se completa la tabla con cero.',recurrence:'Usamos las dos filas anteriores. Los colores vinculan cada operando con su posición en la tabla.',auxiliary:'La fila original es nula. Construimos el polinomio auxiliar con la fila anterior y usamos su derivada.',epsilon:'El primer elemento es cero. Se sustituye por un epsilon positivo y se estudia el límite por la derecha.'};
export default function Routh({value,onChange}:{value:Input;onChange:(v:Input)=>void}){
 const id=useId();
 const [symbolic,setSymbolic]=useState(false);
 const [result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[selected,select]=useState('2:0');
 const [draft,setDraft]=useState(value.expression),[gain,setGain]=useState(String(value.k));
 useEffect(()=>{setDraft(value.expression);setGain(String(value.k))},[value.expression,value.k]);
 useEffect(()=>{
  const controller=new AbortController();let current=true;setResult(null);setError('');
  const timer=setTimeout(()=>{fetch('/api/routh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),signal:controller.signal})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(typeof d.detail==='string'?d.detail:'Revisá la expresión y sus parámetros.');return d})
   .then(d=>{if(current)setResult(d)}).catch(e=>{if(current&&e.name!=='AbortError')setError(String(e.message))})},150);
  return()=>{current=false;clearTimeout(timer);controller.abort()};
 },[value]);
 const rows=(symbolic&&result?.symbolicRows?result.symbolicRows:result?.rows)||[];
 const degree=symbolic&&result?.symbolicRows?result.symbolicDegree:result?.degree||0;
 const cells=rows.flat();
 const active=cells.find(c=>c.id===selected)||cells[0];
 const changed=draft!==value.expression||gain!==String(value.k);
 const invalid=!draft.trim()||!gain.trim()||!Number.isFinite(Number(gain))||Number(gain)<0;
 const choose=(expression:string,k:number)=>{select('2:0');onChange({source:'polynomial',expression,k})};
 return <section className="routh-workspace" aria-label="Criterio de Routh-Hurwitz">
  <div className="routh-heading"><div><span className="eyebrow">CRITERIO DE ESTABILIDAD / TIEMPO CONTINUO</span><h2>Del polinomio a la estabilidad.</h2><p>Construí la tabla. Elegí una celda. Seguí cada operación.</p></div><span className="routh-edition">ROUTH<br/><b>HURWITZ</b></span></div>
  <div className="routh-input-panel">
   <div className="routh-section-title"><span>01</span><h3>Definir el sistema</h3></div>
   <label className="routh-field" htmlFor={`${id}-examples`}>Biblioteca de casos <small>13 tipos · 10 variantes por tipo</small></label>
   <select id={`${id}-examples`} aria-label="Ejemplos de Routh" value="" onChange={e=>{const item=examples.find(x=>x.id===e.target.value);if(item)choose(item.expression,item.k)}}><option value="">Cargar un ejemplo de la biblioteca…</option>{Object.entries(labels).map(([group,label])=><optgroup key={group} label={label}>{examples.filter(x=>x.group===group).map(x=><option key={x.id} value={x.id}>{label} · {x.id.split('-').at(-1)} · {x.expression}</option>)}</optgroup>)}</select>
   <form className="routh-form" onSubmit={e=>{e.preventDefault();if(!invalid)onChange({...value,expression:draft,k:Number(gain)})}}>
    <label className="routh-field">Tipo de entrada<select value={value.source} onChange={e=>onChange({...value,source:e.target.value})}><option value="polynomial">Polinomio característico</option><option value="transfer">Transferencia · analizar denominador</option><option value="locus">Desde LGR · K automático</option></select></label>
    <label className="routh-field routh-expression">Expresión<textarea rows={2} aria-label="Expresión Routh" spellCheck={false} value={draft} onChange={e=>setDraft(e.target.value)} aria-describedby={`${id}-help`}/></label>
    <label className="routh-field routh-gain">Ganancia K<input type="number" min="0" step="any" value={gain} onChange={e=>setGain(e.target.value)} aria-label="Ganancia de Routh"/></label>
    <button type="submit" className="routh-calculate" disabled={invalid}>Calcular tabla <span aria-hidden="true">↗</span></button>
   </form>
   <p className="routh-caption">{value.source==='locus'?'K es la variable de ganancia: no hace falta escribirla. Ingresá L₀(s); el sistema forma D(s) + K·N(s).':'K es opcional: usala si tu polinomio o denominador depende de una ganancia variable.'}</p><div className="routh-input-footer"><p id={`${id}-help`}>Potencias: s^3 · productos: 2*s · fracciones: 1/2. {changed?'Borrador sin calcular.':'La tabla corresponde a la entrada enviada.'}</p><div><button onClick={()=>choose(defaultRouth.expression,10)}>Ejemplo cúbico</button><button onClick={()=>choose('s^5+3*s^4+s^3-2*s^2-3*s-1',1)}>Ejercicio anterior</button></div></div>
   <div className="routh-preview"><span className="eyebrow">VISTA PREVIA DE LA ENTRADA {changed?'· BORRADOR':''}</span><div><BlockFormula expression={draft} display/></div></div>
  </div>
  {error&&<div className="routh-error" role="alert"><b>No se pudo construir la tabla.</b><p>{error}</p></div>}
  {!result&&!error&&<p className="routh-loading" role="status">Construyendo la tabla y sus operaciones…</p>}
  {result&&<>
   <div className="routh-summary" aria-live="polite"><div className={`routh-verdict ${result.status}`}><span className="eyebrow">RESULTADO PARA K = {value.k}</span><h3>{statusLabel[result.status]} · {result.changes} cambios de signo</h3><p>{result.changes} polos en el semiplano derecho. {result.status==='boundary'?'Raíces simples sobre el eje imaginario.':result.status==='unstable'&&result.changes===0?'Hay raíces repetidas sobre el eje imaginario.':''}</p></div><div className="routh-interval"><span className="eyebrow">VALORES DE K CON ESTABILIDAD ASINTÓTICA</span><div>{result.intervalLatex?<RouthMath latex={result.intervalLatex==='\\text{False}'?String.raw`\varnothing`:result.intervalLatex} display/>:<p>Intervalos no determinados.</p>}</div><div className="routh-critical">{result.critical.map(k=><button key={k} onClick={()=>onChange({...value,k})}>K = {k}</button>)}{result.critical.length>0&&<small>Explorar un valor crítico</small>}</div></div></div>
   <div className="routh-polynomial"><span className="eyebrow">ECUACIÓN CARACTERÍSTICA</span><div><RouthMath latex={`P(s,K) = ${result.characteristicLatex}`} display/></div><div><RouthMath latex={`P(s,${value.k}) = ${result.evaluatedLatex} = 0`} display/></div></div>
   <div className="routh-calculation">
    <section className="routh-table-panel"><div className="routh-section-title"><span>02</span><h3>Tabla de Routh</h3></div><p className="routh-caption">Seleccioná cualquier valor para ver su desarrollo.</p>{result.symbolicRows&&<label className="routh-caption"><input type="checkbox" checked={symbolic} onChange={e=>setSymbolic(e.target.checked)}/> Tabla simbólica en K (como en el libro)</label>}{symbolic&&result.symbolicRows&&<p className="routh-caption">Fórmulas para K general. Los signos y la clasificación se evalúan con K = {value.k}; en valores críticos se aplican procedimientos especiales.</p>}<div className="routh-table-scroll" tabIndex={0} role="region" aria-label="Tabla de Routh desplazable"><table className="routh-table"><thead><tr><th scope="col">Potencia</th>{rows[0].map((_,i)=><th key={i} scope="col">{i===0?'Primera columna':`Columna ${i+1}`}</th>)}</tr></thead><tbody>{rows.map((row,r)=><tr key={r}><th scope="row"><RouthMath latex={`s^{${degree-r}}`}/></th>{row.map(c=>{const operand=active?.refs.indexOf(c.id)??-1;return <td key={c.id}><button type="button" aria-label={`Fila s elevado a ${degree-r}, columna ${Number(c.id.split(':')[1])+1}: ${c.value}`} aria-pressed={active?.id===c.id} className={`${active?.id===c.id?'is-active ':''}${operand>=0?'is-operand':''}`} style={operand>=0?{'--operand-color':palette[operand]} as CSSProperties:undefined} onClick={()=>select(c.id)}><RouthMath latex={c.latex}/></button></td>})}</tr>)}</tbody></table></div><div className="routh-signs"><span>Signos para K = {value.k} · primera columna</span><div>{result.signs.map((sign,i)=><span key={i} className={sign<0?'negative':''}>{sign>0?'+':'−'}</span>)}</div></div></section>
    <aside className="routh-explanation" aria-label="Desarrollo de la celda"><div className="routh-section-title"><span>03</span><h3>Cómo se calculó</h3></div>{active&&<div key={active.id} className="routh-cell-detail"><div className="routh-cell-address"><RouthMath latex={`s^{${degree-Number(active.id.split(':')[0])}}`}/><span>Columna {Number(active.id.split(':')[1])+1}</span><span className="routh-cell-type">{active.kind==='recurrence'?'Recurrencia':active.kind==='auxiliary'?'Polinomio auxiliar':active.kind==='epsilon'?'Caso especial':'Coeficiente'}</span></div><p className="routh-caption">{explanations[active.kind]}</p>{active.kind==='recurrence'&&<><div className="routh-formula"><RouthMath latex={String.raw`\frac{\textcolor{#e9b45e}{a}\cdot\textcolor{#6ebce6}{u}-\textcolor{#c99ae8}{b}\cdot\textcolor{#6ad5b2}{v}}{\textcolor{#e9b45e}{a}}`} display/></div><div className="routh-operands">{active.refs.map((ref,i)=><div key={`${ref}-${i}`} style={{'--operand-color':palette[i]} as CSSProperties}><RouthMath latex={`${['a','u','b','v'][i]} = ${cells.find(c=>c.id===ref)?.latex||'0'}`}/></div>)}</div></>}
     <ol className="routh-steps">{active.stepsLatex.map((step,i)=><li key={i}><span>{i===active.stepsLatex.length-1?'Resultado':i===0?'Sustitución':'Simplificación'}</span><div><RouthMath latex={step} display/></div></li>)}</ol>
    </div>}</aside>
   </div>
   {result.events.length>0&&<div className="routh-events"><span className="eyebrow">CASOS ESPECIALES APLICADOS</span>{result.events.map((e,i)=><p key={i}>{e}</p>)}</div>}
  </>}
 </section>
}
