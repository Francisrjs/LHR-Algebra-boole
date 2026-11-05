const fs=require('node:fs');
const katex=require('../frontend/node_modules/katex');
(async()=>{
 const cases=JSON.parse(fs.readFileSync('frontend/src/routhExamples.json','utf8'));let count=0;
 for(const c of cases){
  const response=await fetch('http://127.0.0.1:8765/api/routh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)});
  if(!response.ok)throw Error(c.id+': HTTP '+response.status);
  const r=await response.json();
  const formulas=[r.characteristicLatex,r.evaluatedLatex,r.intervalLatex,...r.rows.flatMap(row=>row.flatMap(cell=>[cell.latex,...cell.stepsLatex]))].filter(Boolean);
  for(const latex of formulas){katex.renderToString(latex,{throwOnError:true,strict:'error',trust:false});count++}
 }
 console.log(`PASS: ${count} fórmulas LaTeX en ${cases.length} ejemplos.`);
})().catch(e=>{console.error(e);process.exitCode=1});
