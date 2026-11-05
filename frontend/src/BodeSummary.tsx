import katex from 'katex';
import type { BodeDecomposition } from './types';
import BodeManualTables from './BodeManualTables';
export function Latex({value}:{value:string}) {
 return <span dangerouslySetInnerHTML={{__html:katex.renderToString(value,{throwOnError:false,trust:false,displayMode:false})}}/>;
}
const fmt=(n:number)=>n.toLocaleString('es-AR',{maximumSignificantDigits:7});
export default function BodeSummary({data,colors}:{data:BodeDecomposition|undefined;colors:string[]}){
 if(!data)return null;
 return <section className="panel bode-summary"><div className="panelhead"><span className="eyebrow">GUÍA PARA HOJA</span><h2>Descomposición para trazado manual</h2></div><div className="bode-summary-body">
 {data.latex&&<div className="bode-normalized" tabIndex={0} role="region" aria-label="Expresión normalizada"><Latex value={data.latex}/></div>}
 {data.gain!==undefined&&<p><b>Ganancia normalizada:</b> {fmt(data.gain)} · {data.gainDb==null?'magnitud −∞ dB':`${fmt(data.gainDb)} dB`} · fase {data.gainPhase==null?'indefinida':`${fmt(data.gainPhase)}°`}</p>}
 {!!data.factors.length&&<div className="bode-table-scroll" tabIndex={0} role="region" aria-label="Factores de Bode"><table><thead><tr><th>Factor</th><th>Tipo</th><th>Quiebre (rad/s)</th><th>Pendiente</th><th>Fase final</th><th>Transición de fase</th></tr></thead><tbody>{data.factors.map((f,i)=><tr key={f.id}><td style={{color:colors[i%colors.length]}}><span className="factor-swatch" style={{background:colors[i%colors.length]}}/><Latex value={f.latex}/></td><td>{f.kind==='pole'?'X Polo':'○ Cero'} · multiplicidad {f.multiplicity}</td><td>{f.frequency?fmt(f.frequency):'ω=0, fuera del eje logarítmico'}</td><td>{f.slope>0?'+':''}{f.slope} dB/década</td><td>{f.phaseFinal==null?'No disponible':`${f.phaseFinal}°`}</td><td>{f.transition?`${fmt(f.transition[0])} → ${fmt(f.transition[1])} rad/s`:'Constante'}</td></tr>)}</tbody></table></div>}
 {!!data.segments.length&&<><h3>Pendiente total por tramos</h3><div className="bode-segments">{data.segments.map((s,i)=><div key={i}><span>{fmt(s.start)} → {s.end==null?'∞':fmt(s.end)} rad/s</span><strong>{s.slope>0?'+':''}{s.slope} dB/década</strong></div>)}</div></>}
 <BodeManualTables data={data}/>
 <p>Las líneas de colores son aproximaciones asintóticas. La fase transiciona entre ω/10 y 10ω; los factores en el origen aportan fase constante.</p><p>X y ○ señalan frecuencias ω=|raíz|. La ubicación compleja se consulta en «Polos y ceros» o «Lugar de las raíces». Una singularidad conserva su guía sin inventar un valor sobre la curva.</p><p className="help">{data.warning}</p>
 </div></section>;
}
