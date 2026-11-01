const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765');await page.locator('.bode-summary .katex').first().waitFor();
 const lines=page.getByRole('checkbox',{name:'Ver aportes por factor'}),marks=page.getByRole('checkbox',{name:'Marcar polos y ceros'});
 assert.equal(await lines.isChecked(),false);assert.equal(await marks.isChecked(),false);
 await lines.check();await marks.check();
 await page.waitForFunction(()=>document.getElementById('bode-chart').data.some(t=>t.legendgroup?.startsWith('factor-')));
 await page.getByRole('button',{name:'Todos',exact:true}).click();
 let chart=await page.locator('#bode-chart').evaluate(el=>({traces:el.data.map(t=>({name:t.name,group:t.legendgroup,symbol:t.marker?.symbol})),annotations:el.layout.annotations}));
 assert.ok((await page.locator('.bode-origin-note').innerText()).includes('ω=0'));assert.ok(chart.traces.some(t=>t.symbol==='x'));
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Guardar proyecto',exact:true}).click();const download=await pending;await download.saveAs('e2e/artifacts/bode-factors-project.json');
 const project=JSON.parse(await fs.readFile('e2e/artifacts/bode-factors-project.json','utf8'));assert.equal(project.factorLines,true);assert.equal(project.factorMarks,true);
 await lines.uncheck();await marks.uncheck();await page.locator('input[type=file]').setInputFiles('e2e/artifacts/bode-factors-project.json');await page.waitForFunction(()=>document.querySelector('.bode-summary'));
 await page.waitForTimeout(500);assert.ok(await lines.isChecked());assert.ok(await marks.isChecked());
 await page.getByTestId('g-input').fill('10*s*(s+10)/((s+100)^2*(s+1000))');
 const response=page.waitForResponse(r=>r.url().endsWith('/api/analyze'));await page.getByRole('button',{name:'ENVIAR',exact:true}).click();assert.equal((await response).status(),200);
 await page.waitForFunction(()=>document.querySelector('.bode-summary').textContent.includes('1000'));
 assert.ok((await page.locator('.bode-summary').innerText()).includes('-40'));
 await page.waitForTimeout(500);chart=await page.locator('#bode-chart').evaluate(el=>el.data.map(t=>({group:t.legendgroup,symbol:t.marker?.symbol})));
 assert.ok(chart.some(t=>t.symbol==='circle-open'));
 await page.screenshot({path:'e2e/artifacts/bode-factors-desktop.png',fullPage:true});
 for(const width of [390,768]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 assert.deepEqual(errors,[]);console.log('PASS: summary LaTeX, independent toggles, gain and factor curves, X/O/origin annotations, project save/reload, explicit submission, responsive layout.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
