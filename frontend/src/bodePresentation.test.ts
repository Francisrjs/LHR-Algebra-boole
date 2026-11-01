import {describe,it,expect} from 'vitest';
import {factorTraces,factorAnnotations,factorColors} from './bodePresentation';
import {initial,validateProject,type Analysis,type BodeDecomposition} from './types';
const d:BodeDecomposition={gainMagnitude:[0,0],gainPhases:[0,0],factors:[{id:'f0',label:'s',latex:'s',kind:'zero',frequency:0,order:1,multiplicity:1,slope:20,phaseFinal:90,phaseAvailable:true,transition:null,magnitude:[0,20],phase:[90,90],marker:null,markerPhase:null,root:{re:0,im:0}}],segments:[],warning:''};
describe('Bode teaching overlays',()=>{
 it('keeps default overlays disabled',()=>expect(factorTraces({omega:[1,10]} as Analysis['bode'],d,false,false)).toEqual([]));
 it('groups magnitude and phase for legend toggling',()=>{const traces=factorTraces({omega:[1,10]} as Analysis['bode'],d,true,false);expect(traces).toHaveLength(4);expect((traces[2] as any).legendgroup).toBe((traces[3] as any).legendgroup);expect((traces[2] as any).line.color).toBe(factorColors[0]);});
 it('annotates origin without a logarithmic zero point',()=>{expect(factorAnnotations(d,true)).toEqual([]);expect(factorTraces({omega:[1,10]} as Analysis['bode'],d,false,true)).toEqual([]);});
 it('preserves overlay project settings',()=>{const p=JSON.parse(JSON.stringify({...initial,factorLines:true,factorMarks:true}));expect(()=>validateProject(p)).not.toThrow();expect(p.factorMarks).toBe(true);expect(()=>validateProject({...initial,factorMarks:'yes'})).toThrow();});
});
