import {describe,it,expect} from 'vitest';
import {prepareFormula} from './formulaDraft';
describe('formula draft validation',()=>{
 it('accepts the exercise and implicit products',()=>expect(prepareFormula('K(s+1)^2(s+100)^2/(s^3(s+10)(s+100))',[],true)).toContain('K*(s+1)^2*(s+100)^2'));
 it('explains a missing closing parenthesis',()=>expect(()=>prepareFormula('1/(s+1',[],true)).toThrow('Falta cerrar 1'));
 it('rejects unknown parameters',()=>expect(()=>prepareFormula('a/(s+1)',[],true)).toThrow('Parámetro desconocido: a'));
 it('accepts declared parameters',()=>expect(prepareFormula('a(s+1)',['a'],true)).toBe('a*(s+1)'));
 it('supports coefficient lists and superscripts',()=>expect(prepareFormula('[1, 2]/(s²+1)',[],true)).toContain('s^2'));
 it('rejects invalid input before submission',()=>{for(const s of ['', 's+','__import__(s)', '1/(s+1))', 's**'])expect(()=>prepareFormula(s,[],true)).toThrow();});
 it('restricts external gain to its leading factor',()=>{expect(()=>prepareFormula('K/(s+1)',[],false)).toThrow();expect(()=>prepareFormula('s+K',[],true)).toThrow();});
 it('accepts scientific notation',()=>expect(prepareFormula('1e-3/(s+1)',[],true)).toBe('1e-3/(s+1)'));
});
