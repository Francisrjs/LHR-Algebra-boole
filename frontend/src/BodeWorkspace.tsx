import {useEffect,useRef,useState} from 'react';
import type {Data,Layout} from 'plotly.js';
import type {BodeDecomposition} from './types';
import {factorColors} from './bodePresentation';
import {Latex} from './BodeSummary';

type Mode='both'|'magnitude'|'phase';
export default function BodeWorkspace({decomposition,lines,marks,onLines,onMarks,render}:{decomposition:BodeDecomposition|undefined;lines:boolean;marks:boolean;onLines:(v:boolean)=>void;onMarks:(v:boolean)=>void;render:(transform:(data:Data[],layout:Partial<Layout>)=>{data:Data[];layout:Partial<Layout>})=>React.ReactNode}){
 const [expanded,setExpanded]=useState(false),[paper,setPaper]=useState(false),[mode,setMode]=useState<Mode>('both');
 const structure=JSON.stringify(decomposition?.factors.map(f=>[f.kind,f.label]));
 const [selection,setSelection]=useState<string[]>([]);const wasLines=useRef(false);
 const [height,setHeight]=useState(window.innerHeight);
 const ref=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{setSelection(decomposition?.factors[0]?[decomposition.factors[0].id]:['gain']);},[structure]);
 useEffect(()=>{if(lines&&!wasLines.current)setSelection(decomposition?.factors[0]?[decomposition.factors[0].id]:['gain']);wasLines.current=lines;},[lines]);
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
  const useMode=expanded?mode:'both';
  const filtered=data.filter(t=>{const group=(t as {legendgroup?:string}).legendgroup;if(group?.startsWith('factor-')&&!selection.includes(group.slice(7)))return false;const phase=(t as {yaxis?:string}).yaxis==='y2';return useMode==='both'||(useMode==='phase'?phase:!phase);}).map(t=>{const group=(t as {legendgroup?:string}).legendgroup;return group?.startsWith('factor-')?{...t,showlegend:false}:t;});
  const h=expanded?Math.max(620,height-230):820;
  const mag=filtered.flatMap(t=>(t as {yaxis?:string}).yaxis==='y2'?[]:((t as {y?:unknown[]}).y||[])).filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
  const spread=mag.length?Math.max(...mag)-Math.min(...mag):100;
  return {data:filtered,layout:{...layout,height:h,grid:undefined,margin:{l:70,r:25,t:55,b:60},legend:{orientation:'h' as const,y:1.1,groupclick:'togglegroup' as const},xaxis:{...layout.xaxis,visible:useMode!=='phase',minor:{showgrid:paper,dtick:'D1',ticks:paper?'inside':'',gridcolor:'#1b2a3c'},gridcolor:'#203047'},xaxis2:{...layout.xaxis2,visible:useMode!=='magnitude',minor:{showgrid:paper,dtick:'D1',ticks:paper?'inside':'',gridcolor:'#1b2a3c'},gridcolor:'#203047'},yaxis:{...layout.yaxis,visible:useMode!=='phase',domain:useMode==='magnitude'?[0,1]:[.57,1],dtick:20*Math.max(1,Math.ceil(spread/240)),gridcolor:'#203047'},yaxis2:{...layout.yaxis2,visible:useMode!=='magnitude',domain:useMode==='phase'?[0,1]:[0,.42],gridcolor:'#203047'},shapes:layout.shapes?.filter(s=>useMode==='both'||(s.yref!=='paper'?(useMode==='phase'?s.yref==='y2':s.yref==='y'):true))} as Partial<Layout>};
 };
 return <div ref={ref} className={`bode-workspace ${expanded?'is-expanded':''}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label={expanded?'Bode ampliado':undefined}>
 <div className="bode-workspace-head"><strong>Respuesta en frecuencia</strong><button onClick={()=>{if(expanded){setExpanded(false);setMode('both');}else{returnFocus.current=document.activeElement as HTMLElement;setExpanded(true);}}}>{expanded?'Cerrar':'Ampliar gráfico'}</button></div>
 <div className="bode-view-tools"><label><input type="checkbox" checked={paper} onChange={e=>setPaper(e.target.checked)}/> Cuadrícula para hoja</label>{expanded&&<label>Vista <select aria-label="Vista ampliada" value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="both">Magnitud y fase</option><option value="magnitude">Solo magnitud</option><option value="phase">Solo fase</option></select></label>}</div>
 <div className="bode-factor-controls"><label><input type="checkbox" checked={lines} onChange={e=>onLines(e.target.checked)}/> Ver aportes por factor</label><label><input type="checkbox" checked={marks} onChange={e=>onMarks(e.target.checked)}/> Marcar polos y ceros</label></div>
 {lines&&<details className="bode-factor-picker" open><summary>Seleccionar factores · {selection.length} visibles</summary><div className="bode-factor-actions"><button onClick={()=>setSelection(['gain',...(decomposition?.factors.map(f=>f.id)||[])])}>Todos</button><button onClick={()=>setSelection([])}>Ninguno</button></div><div className="bode-factor-options">{[{id:'gain',latex:'\\text{Ganancia constante}'},...(decomposition?.factors||[])].map((f,i)=><label key={f.id} style={{color:i?factorColors[(i-1)%factorColors.length]:'#d3d8e0'}}><input type="checkbox" checked={selection.includes(f.id)} onChange={e=>setSelection(old=>e.target.checked?[...old,f.id]:old.filter(id=>id!==f.id))}/><Latex value={f.latex}/></label>)}</div></details>}
 {marks&&decomposition?.factors.some(f=>!f.frequency)&&<p className="bode-origin-note">{decomposition.factors.filter(f=>!f.frequency).map(f=>`${f.kind==='pole'?'X Polo':'○ Cero'} ×${f.multiplicity}: ω=0, fuera del eje logarítmico`).join(' · ')}</p>}
 {render(transform)}
 </div>;
}
