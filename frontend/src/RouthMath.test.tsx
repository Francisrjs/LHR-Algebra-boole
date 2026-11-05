import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import RouthMath from './RouthMath';
describe('Routh LaTeX',()=>{
 it('renders real fractions and powers with accessible MathML',()=>{const html=renderToStaticMarkup(<RouthMath latex={String.raw`\frac{5}{3}s^2`} display/>);expect(html).toContain('katex');expect(html).toContain('<math');expect(html).toContain('mfrac');expect(html).toContain('msup')});
 it('renders intervals, limits and auxiliary derivatives',()=>{for(const latex of [String.raw`0<K\land K<6`,String.raw`\varepsilon\to0^+`,String.raw`A^{\prime}(s)=2s`,String.raw`\varnothing`]){expect(renderToStaticMarkup(<RouthMath latex={latex}/>)).toContain('katex')}});
 it('does not render unsafe commands or broken LaTeX as HTML',()=>{const html=renderToStaticMarkup(<RouthMath latex={String.raw`\htmlClass{injected}{x}`}/>);expect(html).not.toContain('class="injected"');expect(html).toContain('no disponible')});
});
