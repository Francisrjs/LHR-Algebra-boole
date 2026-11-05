import katex from 'katex';
import 'katex/dist/katex.min.css';
export default function RouthMath({latex,display=false}:{latex:string;display?:boolean}) {
  try {
    const html=katex.renderToString(latex,{displayMode:display,throwOnError:true,trust:false,output:'htmlAndMathml',strict:'error'});
    return <span className="routh-math" dangerouslySetInnerHTML={{__html:html}}/>;
  } catch {return <span className="routh-math-error">Expresión matemática no disponible</span>;}
}
