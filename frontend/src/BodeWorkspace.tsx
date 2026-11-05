import {useEffect,useRef,useState} from 'react';
import type {Data,Layout,PlotData} from 'plotly.js';
import type {BodeDecomposition} from './types';
import {factorColors} from './bodePresentation';
import {Latex} from './BodeSummary';
import {manualRows,manualValue} from './bodeManual';

type Mode='both'|'magnitude'|'phase';
export default function BodeWorkspace({decomposition,lines,marks,onLines,onMarks,onAsymptotic,onFitPhase,onFitVertical,render}:{decomposition:BodeDecomposition|undefined;lines:boolean;marks:boolean;onLines:(v:boolean)=>void;onMarks:(v:boolean)=>void;onAsymptotic:(v:boolean)=>void;onFitPhase:()=>void;onFitVertical:()=>void;render:(transform:(data:Data[],layout:Partial<Layout>)=>{data:Data[];layout:Partial<Layout>})=>React.ReactNode}){
 const [stroke,setStroke]=useState('normal');
 const [handDrawing,setHandDrawing]=useState(true),[showExact,setShowExact]=useState(false);
 const [expanded,setExpanded]=useState(false),[paper,setPaper]=useState(false),[mode,setMode]=useState<Mode>('both');
 const structure=JSON.stringify(decomposition?.factors.map(f=>[f.kind,f.label]));
 const [selection,setSelection]=useState<string[]>([]);const wasLines=useRef(false);
 const [height,setHeight]=useState(window.innerHeight);
 const ref=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{onLines(true);onMarks(true);onAsymptotic(true);onFitVertical();},[]);
 useEffect(()=>{setSelection(handDrawing?['gain',...(decomposition?.factors.map(f=>f.id)||[])]:decomposition?.factors[0]?[decomposition.factors[0].id]:['gain']);},[structure]);
 useEffect(()=>{if(lines&&!wasLines.current&&!handDrawing)setSelection(decomposition?.factors[0]?[decomposition.factors[0].id]:['gain']);wasLines.current=lines;},[lines]);
 useEffect(()=>{const resize=()=>setHeight(window.innerHeight);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{
  if(!expanded)return;
  const old=document.body.style.overflow;document.body.style.overflow='hidden';
  const node=ref.current!;
  const focusables=()=>Array.from(node.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,[tabindex]' )).filter(el=>el.getClientRects().length&&el.tabIndex>=0&&!el.hasAttribute('disabled'));
  focusables()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setExpanded(false);setMode('both');}if(e.key==='Tab'){const all=focusables();const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  const focus=(e:FocusEvent)=>{if(!node.contains(e.target as Node))focusables()[0]?.focus();};
  document.addEventListener('keydown',key);document.addEventListener('focusin',focus);
  return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);document.removeEventListener('focusin',focus);returnFocus.current?.focus();};
 },[expanded]);
 const transform=(data:Data[],layout:Partial<Layout>)=>{
  if(handDrawing&&decomposition){
   const sample=data.find(t=>String(t.name)==='Magnitud exacta') as Partial<PlotData>|undefined;
   const frequencies=sample?.x as number[]|undefined;
   const rows=manualRows(decomposition,frequencies?.length?[frequencies[0],frequencies[frequencies.length-1]]:undefined);
   data=data.map(t=>{
    const trace=t as Partial<PlotData>,phase=trace.yaxis==='y2',group=trace.legendgroup;
    const total=['Magnitud asintótica','Fase asintótica'].includes(String(t.name));
    const index=decomposition.factors.findIndex(f=>group===`factor-${f.id}`);
    if(total||group==='factor-gain'||index>=0)return {...t,x:rows.map(r=>r.omega),y:rows.map(r=>total?(phase?r.phase:r.magnitude):group==='factor-gain'?(phase?decomposition.gainPhase:decomposition.gainDb):(phase?r.phases[index]:r.magnitudes[index])),mode:total?'lines+markers':'lines',marker:{size:5},line:{...trace.line,shape:'linear'},connectgaps:false} as Data;
    // Pole/zero symbols also belong on the approximate total in manual mode.
    if(trace.mode==='markers'&&trace.x?.length===1){const value=manualValue(decomposition,Number(trace.x[0]));return {...t,y:[phase?value.phase:value.magnitude]} as Data;}
    return t;
   });
  }
  const useMode=expanded?mode:'both';
  const filtered=data.filter(t=>{if(handDrawing&&!showExact&&['Magnitud exacta','Fase exacta'].includes(String(t.name)))return false;const group=(t as {legendgroup?:string}).legendgroup;if(group?.startsWith('factor-')&&!selection.includes(group.slice(7)))return false;const phase=(t as {yaxis?:string}).yaxis==='y2';return useMode==='both'||(useMode==='phase'?phase:!phase);}).map(t=>{const group=(t as {legendgroup?:string}).legendgroup;const plot=t as Partial<PlotData>;const width=stroke==='thin'?2:stroke==='thick'?5:3.2;const styled=plot.mode?.includes('lines')?{...plot,line:{...plot.line,dash:'solid' as const,width:group?.startsWith('factor-')?width*.55:width}}:t;return group?.startsWith('factor-')?{...styled,showlegend:false}:styled;});
  const h=expanded?Math.max(620,height-230):820;
  const mag=filtered.flatMap(t=>(t as {yaxis?:string}).yaxis==='y2'?[]:((t as {y?:unknown[]}).y||[])).filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
  const spread=mag.length?Math.max(...mag)-Math.min(...mag):100;
  return {data:filtered,layout:{...layout,height:h,grid:undefined,margin:{l:70,r:25,t:55,b:60},legend:{orientation:'h' as const,y:1.1,groupclick:'togglegroup' as const},xaxis:{...layout.xaxis,visible:useMode!=='phase',minor:{showgrid:paper,dtick:'D1',ticks:paper?'inside':'',gridcolor:'#1b2a3c'},showgrid:paper,gridcolor:'#203047'},xaxis2:{...layout.xaxis2,visible:useMode!=='magnitude',minor:{showgrid:paper,dtick:'D1',ticks:paper?'inside':'',gridcolor:'#1b2a3c'},showgrid:paper,gridcolor:'#203047'},yaxis:{...layout.yaxis,visible:useMode!=='phase',domain:useMode==='magnitude'?[0,1]:[.57,1],dtick:20*Math.max(1,Math.ceil(spread/240)),showgrid:paper,gridcolor:'#203047'},yaxis2:{...layout.yaxis2,visible:useMode!=='magnitude',domain:useMode==='phase'?[0,1]:[0,.42],showgrid:paper,gridcolor:'#203047'},shapes:layout.shapes?.filter(s=>useMode==='both'||(s.yref!=='paper'?(useMode==='phase'?s.yref==='y2':s.yref==='y'):true))} as Partial<Layout>};
 };
 return <div ref={ref} className={`bode-workspace ${expanded?'is-expanded':''}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label={expanded?'Bode ampliado':undefined}>
 <div className="bode-workspace-head"><strong>Respuesta en frecuencia</strong><button onClick={()=>{if(expanded){setExpanded(false);setMode('both');}else{returnFocus.current=document.activeElement as HTMLElement;setExpanded(true);}}}>{expanded?'Cerrar':'Ampliar gráfico'}</button></div>
 <div className="bode-method-tools"><button aria-pressed={handDrawing} onClick={()=>{setHandDrawing(true);setShowExact(false);onFitVertical();onLines(true);onMarks(true);onAsymptotic(true);setSelection(['gain',...(decomposition?.factors.map(f=>f.id)||[])]);}}>Método de contribuciones</button>{handDrawing&&<><button onClick={()=>{setHandDrawing(false);onLines(false);onAsymptotic(false);}}>Volver a curva exacta</button><label><input type="checkbox" checked={showExact} onChange={e=>setShowExact(e.target.checked)}/> Comparar con curva exacta</label></>}</div>
 {handDrawing&&<p className="bode-scale-note">Trazado para la hoja: se suman los aportes de ganancia, polos y ceros. Cada factor simple cambia la pendiente ±20 dB/década; un par, ±40. La fase se aproxima con rectas entre ω₀/10 y 10·ω₀. La suma total incluye todos los factores, aunque ocultes alguno.</p>}
 <div className="bode-view-tools"><label>Grosor de líneas<select aria-label="Grosor de líneas" value={stroke} onChange={e=>setStroke(e.target.value)}><option value="thin">Fino</option><option value="normal">Normal</option><option value="thick">Grueso</option></select></label><button onClick={onFitPhase}>Ajustar fase</button><label><input type="checkbox" checked={paper} onChange={e=>setPaper(e.target.checked)}/> Cuadrícula para hoja</label>{expanded&&<label>Vista <select aria-label="Vista ampliada" value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="both">Magnitud y fase</option><option value="magnitude">Solo magnitud</option><option value="phase">Solo fase</option></select></label>}</div>
 <p className="bode-scale-note">Frecuencia en escala logarítmica: 0,1 → 1 → 10 → 100 → 1000. Cada intervalo multiplica por 10.</p>
 <div className="bode-factor-controls"><label><input type="checkbox" checked={lines} onChange={e=>onLines(e.target.checked)}/> Ver aportes por factor</label><label><input type="checkbox" checked={marks} onChange={e=>onMarks(e.target.checked)}/> Marcar polos y ceros</label></div>
 {lines&&<details className="bode-factor-picker" open><summary>Seleccionar factores · {selection.length} visibles</summary><div className="bode-factor-actions"><button onClick={()=>setSelection(['gain',...(decomposition?.factors.map(f=>f.id)||[])])}>Todos</button><button onClick={()=>setSelection([])}>Ninguno</button></div><div className="bode-factor-options">{[{id:'gain',latex:'\\text{Ganancia constante}'},...(decomposition?.factors||[])].map((f,i)=><label key={f.id} style={{color:i?factorColors[(i-1)%factorColors.length]:'#d3d8e0'}}><input type="checkbox" checked={selection.includes(f.id)} onChange={e=>setSelection(old=>e.target.checked?[...old,f.id]:old.filter(id=>id!==f.id))}/><Latex value={f.latex}/></label>)}</div></details>}
 {marks&&decomposition?.factors.some(f=>!f.frequency)&&<p className="bode-origin-note">{decomposition.factors.filter(f=>!f.frequency).map(f=>`${f.kind==='pole'?'X Polo':'○ Cero'} ×${f.multiplicity}: ω=0, fuera del eje logarítmico`).join(' · ')}</p>}
 {decomposition?.factors.some(f=>!f.phaseAvailable)&&<p className="bode-origin-note">La fase asintótica total no está disponible para este modelo: contiene factores sobre el eje imaginario. Los aportes definidos siguen visibles.</p>}
 {render(transform)}
 </div>;
}
