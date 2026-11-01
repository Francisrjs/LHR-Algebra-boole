const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}});let requests=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/api/analyze'))requests++;});
 await page.goto('http://127.0.0.1:8765');await page.locator('.bode-summary .katex').first().waitFor();await page.waitForTimeout(400);
 await page.getByRole('checkbox',{name:'Ver aportes por factor'}).check();await page.getByRole('checkbox',{name:'Marcar polos y ceros'}).check();
 await page.waitForFunction(()=>document.getElementById('bode-chart').data.filter(t=>t.legendgroup?.startsWith('factor-')).length===2);
 await page.getByRole('button',{name:'Todos',exact:true}).click();await page.waitForFunction(()=>document.getElementById('bode-chart').data.filter(t=>t.legendgroup?.startsWith('factor-')).length>2);
 await page.getByRole('button',{name:'Ninguno',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('bode-chart').data.some(t=>t.legendgroup?.startsWith('factor-')));
 await page.getByRole('button',{name:'Todos',exact:true}).click();
 await page.evaluate(async()=>{const el=document.getElementById('bode-chart');el.emit('plotly_relayout',{'xaxis.range':[-1,1],'xaxis2.range':[-1,1]});});await page.waitForTimeout(200);
 const before=requests;await page.getByRole('button',{name:'Ampliar gráfico',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Bode ampliado'});await dialog.waitFor();
 assert.equal(await page.locator('#bode-chart').count(),1);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
 await page.getByLabel('Vista ampliada').selectOption('phase');await page.waitForFunction(()=>document.getElementById('bode-chart').layout.yaxis.visible===false);
 await page.getByLabel('Vista ampliada').selectOption('magnitude');await page.waitForFunction(()=>document.getElementById('bode-chart').layout.yaxis2.visible===false);
 await page.getByLabel('Vista ampliada').selectOption('both');
 await page.getByRole('checkbox',{name:'Cuadrícula para hoja'}).check();await page.waitForFunction(()=>document.getElementById('bode-chart').layout.xaxis.minor.showgrid===true);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.ok(await page.getByRole('button',{name:'Ampliar gráfico'}).evaluate(el=>el===document.activeElement));assert.equal(requests,before);
 const range=await page.locator('#bode-chart').evaluate(el=>el.layout.xaxis.range);assert.deepEqual(range,[-1,1]);
 for(const width of [390,768,1100,1600]){await page.setViewportSize({width,height:650});await page.getByRole('button',{name:'Ampliar gráfico'}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.keyboard.press('Escape');}
 await page.setViewportSize({width:1600,height:1100});await page.screenshot({path:'e2e/artifacts/bode-clean.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: factor selection, clean grid, single chart, expanded modes, Escape/focus/scroll, zoom preservation, no analysis request, responsive sizes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
