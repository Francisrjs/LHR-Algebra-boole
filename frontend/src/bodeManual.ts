import type {BodeDecomposition} from './types';
const tidy=(n:number)=>Number(n.toPrecision(12));
const sum=(base:number|null|undefined,values:(number|null)[])=>base==null||values.some(v=>v==null)?null:tidy(base+values.reduce<number>((a,v)=>a+(v??0),0));
export function manualValue(d:BodeDecomposition,omega:number){
 const magnitudes=d.factors.map(f=>tidy(f.slope*(f.frequency?Math.max(0,Math.log10(omega/f.frequency)):Math.log10(omega))));
 const phases=d.factors.map(f=>!f.phaseAvailable||f.phaseFinal==null?null:tidy(f.phaseFinal*(f.frequency?Math.max(0,Math.min(1,(Math.log10(omega/f.frequency)+1)/2)):1)));
 return {omega,magnitudes,phases,magnitude:sum(d.gainDb,magnitudes),phase:sum(d.gainPhase,phases),slope:d.factors.filter(f=>f.frequency<=omega*(1+1e-10)).reduce((a,f)=>a+f.slope,0)};
}
// Connecting decades and all corners gives straight segments on a logarithmic axis.
export function manualRows(d:BodeDecomposition,range?:[number,number]){
 const breaks=d.factors.flatMap(f=>f.frequency>0?[f.frequency/10,f.frequency,f.frequency*10]:[]).map(tidy);
 const lo=range?.[0]??(breaks.length?10**(Math.floor(Math.log10(Math.min(...breaks)))-1):.01);
 const hi=range?.[1]??(breaks.length?10**Math.ceil(Math.log10(Math.max(...breaks))):100);
 const points=[lo,hi,...breaks];
 for(let exponent=Math.ceil(Math.log10(lo));exponent<=Math.floor(Math.log10(hi));exponent++)points.push(10**exponent);
 return [...new Set(points.filter(w=>w>=lo&&w<=hi).map(tidy))].sort((a,b)=>a-b).map(w=>manualValue(d,w));
}
