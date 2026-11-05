const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');
  await page.getByTestId('g-input').fill('10*(1+s/10)*(1+s/100)*(1+s/1000)/s^3');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Puntos para dibujar"] tbody')?.textContent.includes('-270'));
  await page.waitForFunction(()=>{
   const data=document.querySelector('#bode-chart')?.data||[];
   return !data.some(t=>t.name==='Magnitud exacta')&&data.some(t=>t.name==='Magnitud asintótica'&&t.x.some((w,i)=>Math.abs(w-100)<1e-7&&Math.abs(t.y[i]+80)<1e-5));
  });
  const rows=await page.getByRole('region',{name:'Puntos para dibujar',exact:true}).locator('tbody tr').allTextContents();
  assert.equal(rows.length,6,JSON.stringify(rows));
  const result=await page.locator('#bode-chart').evaluate(el=>{
   const mag=el.data.find(t=>t.name==='Magnitud asintótica');
   const phase=el.data.find(t=>t.name==='Fase asintótica');
   return {values:[.1,1,10,100,1000,10000].map(w=>{const i=mag.x.findIndex(x=>Math.abs(x/w-1)<1e-8);return [mag.y[i],phase.y[i]];}),shape:mag.line.shape,mode:mag.mode};
  });
  result.values.forEach(([m,p],i)=>{assert.ok(Math.abs(m-[80,20,-40,-80,-100,-100][i])<1e-5);assert.ok(Math.abs(p-[-270,-270,-225,-135,-45,0][i])<1e-5);});
  assert.equal(result.shape,'linear');assert.equal(result.mode,'lines+markers');
  const axes=await page.locator('#bode-chart').evaluate(el=>['xaxis','xaxis2'].map(key=>({range:el._fullLayout[key].range,labels:el._fullLayout[key].ticktext,grid:el._fullLayout[key].showgrid,minorGrid:(el._fullLayout[key].minor?.showgrid??false)})));
  for(const axis of axes){assert.equal(axis.range[0],-1);assert.ok(axis.labels.includes('0,1'));assert.ok(axis.labels.includes('1'));assert.ok(axis.labels.includes('10'));assert.equal(axis.grid,false);assert.equal(axis.minorGrid,false);}
  assert.equal(await page.getByRole('checkbox',{name:'Cuadrícula para hoja',exact:true}).isChecked(),false);
  await page.locator('#bode-chart').screenshot({path:'e2e/artifacts/bode-manual.png'});
  await page.getByRole('region',{name:'Puntos para dibujar',exact:true}).screenshot({path:'e2e/artifacts/bode-manual-table.png'});
  await page.getByRole('checkbox',{name:'Comparar con curva exacta',exact:true}).check();
  await page.waitForFunction(()=>document.querySelector('#bode-chart').data.some(t=>t.name==='Magnitud exacta'));
  assert.deepEqual(errors,[]);
  console.log('PASS: ejercicio de tres ceros, tablas, rectas y comparación exacta.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
