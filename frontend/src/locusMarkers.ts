import type {PlotData} from 'plotly.js';
type Landmarks={crossings:{omega:number;k:number}[];breakaways:{re:number;im:number;k?:number}[]};
const fmt=(n:number)=>Number(n.toPrecision(5)).toLocaleString('es-AR',{maximumFractionDigits:6});
export function locusMarkers(locus:Landmarks):Partial<PlotData>[]{
 const crossings=locus.crossings.flatMap(c=>[{x:0,y:c.omega,k:c.k},{x:0,y:-c.omega,k:c.k}]);
 return [{type:'scatter',mode:'text+markers',name:'Cruces del eje imaginario',x:crossings.map(c=>c.x),y:crossings.map(c=>c.y),customdata:crossings.map(c=>c.k),text:crossings.map(c=>`s = ${c.y<0?'−':''}j${fmt(Math.abs(c.y))}`),textposition:'top right',textfont:{color:'#72e3ce',size:11},marker:{symbol:'diamond-open',size:13,color:'#72e3ce',line:{width:2}},hovertemplate:'Cruce del eje imaginario<br>s = %{y:.6g}j<br>K crítico = %{customdata:.6g}<extra></extra>'},
 {type:'scatter',mode:'text+markers',name:'Puntos de ruptura',x:locus.breakaways.map(b=>b.re),y:locus.breakaways.map(b=>b.im),customdata:locus.breakaways.map(b=>b.k??null),text:locus.breakaways.map(b=>`s = ${fmt(b.re)}`),textposition:'bottom left',textfont:{color:'#f5be70',size:11},marker:{symbol:'diamond',size:10,color:'#f5be70',line:{color:'#101b2c',width:1}},hovertemplate:'Punto de ruptura<br>s = %{x:.6g}<br>K = %{customdata:.6g}<extra></extra>'}];
}
