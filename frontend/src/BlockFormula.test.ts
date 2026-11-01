import {describe,it,expect} from 'vitest';
import {expressionLatex} from './BlockFormula';
describe('block formula presentation',()=>{
 it('renders fractions and powers',()=>{expect(expressionLatex('1/((s+1)*(s+2))')).toContain('\\frac{1}');expect(expressionLatex('s**2')).toContain('^{2}');});
 it('rejects executable syntax',()=>{expect(()=>expressionLatex('<script>')).toThrow();expect(()=>expressionLatex('f(s)')).toThrow();});
});
