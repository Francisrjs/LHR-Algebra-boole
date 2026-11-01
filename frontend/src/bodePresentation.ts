import type { Data, Layout } from 'plotly.js';
import type { Analysis, BodeDecomposition } from './types';
export const factorColors=['#f57888','#b899ff','#ffb45e','#62dbab','#6bcdf0','#e3be75','#e693cf','#98b4ff'];
const dashes=['dot','dash','dashdot','longdash'] as const;
export function factorTraces(b:Analysis['bode'],d:BodeDecomposition|undefined,lines:boolean,marks:boolean):Data[]{
 if(!d)return [];
 const traces:Data[]=[];
 if(lines&&d.gainMagnitude&&d.gainPhases){
  for(const phase of [false,true])traces.push({type:'scatter',mode:'lines',x:b.omega,y:phase?d.gainPhases:d.gainMagnitude,name:'Ganancia constante',legendgroup:'factor-gain',showlegend:!phase,...(phase?{xaxis:'x2',yaxis:'y2'}:{}),line:{color:'#d3d8e0',dash:'dash',width:1.5},hovertemplate:'Ganancia constante<br>ω=%{x}<br>%{y}<extra></extra>'});
 }
 d.factors.forEach((f,i)=>{
  const color=factorColors[i%factorColors.length];const name=`${f.kind==='pole'?'X Polo':'○ Cero'} · ${f.label}`;
  if(lines)for(const phase of [false,true])traces.push({type:'scatter',mode:'lines',x:b.omega,y:phase?f.phase:f.magnitude,name,legendgroup:`factor-${f.id}`,showlegend:!phase,...(phase?{xaxis:'x2',yaxis:'y2'}:{}),line:{color,dash:dashes[i%dashes.length],width:1.3},hovertemplate:`${name}<br>ω=%{x} rad/s<br>%{y}${phase?'°':' dB'}<extra></extra>`});
  if(marks&&f.frequency>0)for(const phase of [false,true]){
   const value=phase?f.markerPhase:f.marker;if(value==null)continue;
   traces.push({type:'scatter',mode:'markers',x:[f.frequency],y:[value],name,showlegend:false,...(phase?{xaxis:'x2',yaxis:'y2'}:{}),marker:{symbol:f.kind==='pole'?'x':'circle-open',size:10,color,line:{width:2}},hovertemplate:`${name}<br>Raíz: ${f.root.re}${f.root.im>=0?'+':''}${f.root.im}j<br>ω=${f.frequency} rad/s<br>Multiplicidad: ${f.multiplicity}<br>%{y}<extra></extra>`});
  }
 });return traces;
}
export function factorAnnotations(d:BodeDecomposition|undefined,marks:boolean):NonNullable<Layout['annotations']>{
 if(!marks||!d)return [];
 const groups=new Map<number,typeof d.factors>();
 d.factors.filter(f=>f.frequency>0).forEach(f=>groups.set(f.frequency,[...(groups.get(f.frequency)||[]),f]));
 return [...groups].map(([frequency,fs])=>({xref:'x',yref:'paper',x:Math.log10(frequency),y:1,text:fs.map(f=>`${f.kind==='pole'?'X':'○'} ×${f.multiplicity}${f.marker==null?' · singularidad':''}`).join(' / '),showarrow:false,yshift:10,font:{color:'#9fb2c9',size:10},bgcolor:'#101b2c'}));
}
