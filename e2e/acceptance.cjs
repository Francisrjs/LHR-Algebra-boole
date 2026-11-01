const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'artifacts'),base=process.env.CONTROLLAB_URL||'http://127.0.0.1:8765';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});
 const errors=[],remote=[];
 await context.route('**/*',r=>{if(!['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)){remote.push(r.request().url());return r.abort()}return r.continue()});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/api/validate-project')&&!r.ok())console.log('Validation error',await r.text())});
 const wait=()=>page.waitForTimeout(400);
 const nav=async name=>{await page.locator('nav').getByRole('button',{name:new RegExp(name,'i')}).click();await wait()};
 const save=async name=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Guardar proyecto',exact:true}).click();const d=await pending;const p=path.join(output,name);await d.saveAs(p);return JSON.parse(await fs.readFile(p,'utf8'))};
 try{
  await page.goto(base);await page.waitForSelector('#bode-chart[data-revision]');
  await nav('Álgebra');
  await page.locator('.algebrabody textarea').nth(0).fill('2/(s+4)');
  await page.locator('.algebrabody textarea').nth(1).fill('3/(s+5)');
  await page.locator('.algebrabody select').selectOption('parallel');
  await page.getByRole('button',{name:'Calcular equivalente'}).click();await wait();
  assert.match(await page.locator('.equivalent').innerText(),/s/);
  const algebra=await save('algebra-project.json');
  assert.deepEqual(algebra.algebra.functions,['2/(s+4)','3/(s+5)']);assert.equal(algebra.algebra.operation,'parallel');
  await page.getByRole('button',{name:'Nuevo',exact:true}).click();await wait();
  await page.locator('input[type=file]').setInputFiles(path.join(output,'algebra-project.json'));await wait();
  assert.equal(await page.locator('.algebrabody textarea').nth(0).inputValue(),'2/(s+4)');
  assert.equal(await page.locator('.algebrabody select').inputValue(),'parallel');
  await page.getByRole('button',{name:'Calcular equivalente'}).click();await wait();
  await page.getByRole('button',{name:/Usar como G/}).click();await wait();
  assert.ok((await save('history-project.json')).history.length>=1);
  await page.getByLabel('Valor de K',{exact:true}).fill('7');await wait();
  await page.getByRole('button',{name:/Restaurar.*guardad/i}).click();await wait();
  assert.equal(await page.getByLabel('Valor de K',{exact:true}).inputValue(),'1');
  await page.evaluate(()=>document.getElementById('bode-chart').emit('plotly_relayout',{'xaxis.range':[0,2],'xaxis2.range':[0,2]}));await wait();
  const zoom=await save('zoom-project.json');assert.ok(zoom.charts?.['bode-chart'],'Zoom was not persisted');
  await page.getByRole('button',{name:'Nuevo',exact:true}).click();await wait();
  await page.locator('input[type=file]').setInputFiles(path.join(output,'zoom-project.json'));await wait();
  assert.deepEqual(await save('zoom-roundtrip.json'),zoom);
  const before=await page.evaluate(()=>document.getElementById('bode-chart').data[0].y);
  const g=page.getByLabel('G(s)',{exact:true});const valid=await g.inputValue();await g.fill('1/(');await wait();
  assert.ok(await page.getByRole('alert').count());assert.deepEqual(await page.evaluate(()=>document.getElementById('bode-chart').data[0].y),before);
  await g.fill(valid);await wait();
  await page.getByRole('button',{name:/Respuesta al escalón/}).click();await wait();await nav('Respuesta temporal');
  for(const signal of ['step','ramp','impulse']){
   const pending=page.waitForResponse(r=>r.url().endsWith('/api/analyze'));
   if(await page.getByLabel('Señal de entrada').inputValue()===signal){await page.getByLabel('Señal de entrada').selectOption(signal==='step'?'ramp':'step');await wait()}
   await page.getByLabel('Señal de entrada').selectOption(signal);const response=await pending;assert.equal(response.status(),200);await wait();
   assert.ok(await page.evaluate(()=>document.getElementById('temporal-chart').data[1].y.every(Number.isFinite)));
  }
  await page.getByRole('button',{name:'GH directo',exact:true}).click();await wait();
  assert.match(await page.locator('.empty').innerText(),/G|H|C\/R/);
  await page.screenshot({path:path.join(output,'direct-temporal-warning.png'),fullPage:true});
  await page.getByRole('button',{name:/Crear equivalente/}).click();await wait();assert.equal(await page.locator('.empty').count(),0);
  for(const order of [6,8]){
   await page.getByLabel('G(s)',{exact:true}).fill('1/('+Array.from({length:order},(_,i)=>`(s+${i+1})`).join('*')+')');await wait();await nav('Diagrama de Bode');
   assert.equal(await page.getByRole('alert').count(),0);assert.ok(await page.evaluate(()=>document.getElementById('bode-chart').data[0].y.some(Number.isFinite)));
  }
  await nav('Álgebra de bloques');
  assert.match(await page.locator('.block-workflow').innerText(),/01\s+Diseñar[\s\S]*02\s+Conectar[\s\S]*03\s+Configurar[\s\S]*04\s+Validar y resolver[\s\S]*05\s+Analizar/);
  const blockSolve=page.waitForResponse(r=>r.url().endsWith('/api/block-diagram/solve'));
  await page.getByRole('button',{name:'Validar y calcular'}).click();
  assert.equal((await blockSolve).status(),200);
  await page.getByText('transferMatrix',{exact:false}).waitFor();
  assert.equal(await page.getByRole('alert').count(),0);
  await page.screenshot({path:path.join(output,'order8-bode.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log(JSON.stringify({passed:true,algebraRoundtrip:true,history:true,lastSavedRestore:true,zoomRoundtrip:true,invalidInputPreserves:true,temporalSignals:3,directModeWarning:true,orders:[6,8],browserErrors:errors,externalRequests:remote},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
