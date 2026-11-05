import {expect,it} from 'vitest';
import {manualRows, manualValue} from './bodeManual';
import type {BodeDecomposition, BodeFactor} from './types';
const factor=(frequency:number,slope:number,phaseFinal:number):BodeFactor=>({id:String(frequency),label:'',latex:'',kind:slope>0?'zero':'pole',frequency,slope,phaseFinal,phaseAvailable:true,order:1,multiplicity:frequency?1:3,transition:frequency?[frequency/10,frequency*10]:null,magnitude:[],phase:[],marker:null,markerPhase:null,root:{re:-frequency,im:0}});
const example:BodeDecomposition={gainDb:20,gainPhase:0,factors:[factor(0,-60,-270),factor(10,20,90),factor(100,20,90),factor(1000,20,90)],segments:[],warning:''};
it('reproduces the hand-drawing contribution tables and outgoing slopes',()=>{
 const rows=manualRows(example);
 expect(rows.map(r=>r.omega)).toEqual([.1,1,10,100,1000,10000]);
 expect(rows.map(r=>r.magnitude)).toEqual([80,20,-40,-80,-100,-100]);
 expect(rows.map(r=>r.phase)).toEqual([-270,-270,-225,-135,-45,0]);
 expect(rows.map(r=>r.slope)).toEqual([-60,-60,-40,-20,0,0]);
 expect(rows[4].magnitudes).toEqual([-180,40,20,0]);
});
it('includes non-decade corners and both ends of phase ramps',()=>{
 const d={...example,factors:[factor(3,20,90)]};
 const rows=manualRows(d);
 for(const w of [.3,3,30])expect(rows.some(r=>Math.abs(r.omega-w)<1e-8)).toBe(true);
 expect(manualValue(d,3).phase).toBe(45);
});
it('does not invent undefined phase or zero-gain magnitude',()=>{
 expect(manualValue({...example,gainDb:null,gainPhase:null},1).magnitude).toBeNull();
 expect(manualValue({...example,factors:[{...factor(3,-40,-180),phaseAvailable:false}]},3).phase).toBeNull();
});
it('keeps decade bounds stable despite root solver roundoff',()=>{
 const d={...example,factors:[factor(0,-60,-270),factor(10-1e-13,20,90),factor(100,20,90),factor(1000+1e-11,20,90)]};
 expect(manualRows(d).map(r=>r.omega)).toEqual([.1,1,10,100,1000,10000]);
});
