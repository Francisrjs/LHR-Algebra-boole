/* Independent end-to-end acceptance checks against a running local build. */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.CONTROLLAB_URL || 'http://127.0.0.1:8765';
const output = path.join(__dirname, 'artifacts');

(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'})});
  const context = await browser.newContext({viewport:{width:1600,height:1000}, acceptDownloads:true});
  const remote = [], errors = [];
  await context.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    if (!['127.0.0.1','localhost'].includes(host)) {
      remote.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base);
    await page.locator('.js-plotly-plot').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.js-plotly-plot')].some(p=>p.data?.length));
    assert.match(await page.locator('body').innerText(), /Bode/);
    await page.screenshot({path:path.join(output,'app-bode.png'), fullPage:true});
    const timings=[];
    for (let k=2;k<=11;k++) {
      const elapsed=await page.evaluate(async value=>{
        const chart=document.getElementById('bode-chart');
        const before=chart.dataset.revision;
        const input=document.querySelector('input[aria-label="Valor de K"]');
        const start=performance.now();
        return await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>{observer.disconnect();reject(Error('Render timeout'))},10000);
          const observer=new MutationObserver(()=>{
            if(chart.dataset.revision!==before){clearTimeout(timeout);observer.disconnect();resolve(performance.now()-start)}
          });
          observer.observe(chart,{attributes:true,attributeFilter:['data-revision']});
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));
          input.dispatchEvent(new Event('input',{bubbles:true}));
        });
      },k);
      timings.push(elapsed);
    }
    const beforeDirect=await page.evaluate(()=>document.getElementById('bode-chart').data[0].y);
    let pendingAnalysis=page.waitForResponse(r=>r.url().endsWith('/api/analyze')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'GH directo',exact:true}).click(); await pendingAnalysis; await page.waitForTimeout(300);
    const afterDirect=await page.evaluate(()=>document.getElementById('bode-chart').data[0].y);
    assert.deepEqual(afterDirect,beforeDirect,'G/H to GH must not apply K twice');
    await page.getByRole('button',{name:'G y H separados',exact:true}).click(); await page.waitForTimeout(350);
    await page.getByRole('button',{name:/Segundo orden/}).click(); await page.waitForTimeout(350);
    const symbolic=await page.getByLabel('G(s)',{exact:true}).inputValue();
    await page.locator('.editorcolumn select').selectOption('g'); await page.waitForTimeout(350);
    await page.getByRole('button',{name:/Polos y ceros/}).click(); await page.waitForTimeout(350);
    await page.getByRole('button',{name:'Convertir a coeficientes para arrastrar'}).click(); await page.waitForTimeout(350);
    assert.notEqual(await page.getByLabel('G(s)',{exact:true}).inputValue(),symbolic);
    await page.locator('#plano-chart').scrollIntoViewIfNeeded();
    const drag=await page.evaluate(()=>{
      const chart=document.getElementById('plano-chart'),s=chart.layout.shapes[0];
      const x=chart._fullLayout.xaxis,y=chart._fullLayout.yaxis,box=chart.getBoundingClientRect();
      return {x:box.x+x._offset+x.l2p((s.x0+s.x1)/2),y:box.y+y._offset+y.l2p((s.y0+s.y1)/2)};
    });
    const pendingRoot=page.waitForResponse(r=>r.url().endsWith('/api/edit-roots'),{timeout:5000});
    await page.screenshot({path:path.join(output,'root-before-drag.png'),fullPage:true});
    await page.mouse.move(drag.x,drag.y); await page.mouse.down(); await page.mouse.move(drag.x-30,drag.y-10,{steps:12}); await page.mouse.up();
    assert.equal((await pendingRoot).status(),200,'Root drag failed'); await page.waitForTimeout(350);
    await page.getByRole('button',{name:'Deshacer',exact:true}).click(); await page.waitForTimeout(350);
    await page.getByRole('button',{name:'Deshacer',exact:true}).click(); await page.waitForTimeout(350);
    assert.equal(await page.getByLabel('G(s)',{exact:true}).inputValue(),symbolic,'Undo must restore parametrized expression');
    await page.getByRole('button',{name:/Ganancia crítica/}).click(); await page.waitForTimeout(350);
    const nav = ['Lugar de las raíces','Polos y ceros','Respuesta temporal','Álgebra de bloques','Diagrama de Bode'];
    for (const label of nav) {
      const button = page.getByRole('button',{name:new RegExp(label,'i')}).first();
      if (await button.count()) { await button.click(); await page.waitForTimeout(350); }
    }
    const save = page.getByRole('button',{name:/guardar/i}).first();
    await page.screenshot({path:path.join(output,'app-after-flows.png'),fullPage:true});
    const pendingSave = page.waitForEvent('download'); await save.click();
    const saved = await pendingSave;
    const savedPath = path.join(output,'project.json'); await saved.saveAs(savedPath);
    const project = JSON.parse(await fs.readFile(savedPath,'utf8'));
    assert.equal(project.format,'controllab'); assert.equal(project.schemaVersion,1);
    const importer = page.locator('input[type=file]').first();
    if (await importer.count()) {
      await importer.setInputFiles(savedPath);
      await page.waitForTimeout(500);
      const pendingRoundtrip = page.waitForEvent('download'); await save.click();
      const roundtrip = await pendingRoundtrip;
      const roundtripPath=path.join(output,'roundtrip.json'); await roundtrip.saveAs(roundtripPath);
      assert.deepEqual(JSON.parse(await fs.readFile(roundtripPath,'utf8')),project);
    }
    for (const format of ['PNG','SVG']) {
      const button=page.getByRole('button',{name:new RegExp(format,'i')}).first();
      assert.equal(await button.count(),1, `${format} export button missing`);
      const pending=page.waitForEvent('download'); await button.click();
      const download=await pending; const file=path.join(output,`bode.${format.toLowerCase()}`);
      await download.saveAs(file); assert.ok((await fs.stat(file)).size>1000);
    }
    assert.deepEqual(remote,[], 'Application attempted external network requests');
    assert.deepEqual(errors,[], 'Browser exceptions');
    console.log(JSON.stringify({passed:true,remoteRequests:remote.length,browserErrors:errors,projectRoundtrip:true,exports:['PNG','SVG'],latencyMs:timings,latencyMax:Math.max(...timings),latencyMedian:[...timings].sort((a,b)=>a-b)[Math.floor(timings.length/2)],screenshot:path.join(output,'app-bode.png')},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

