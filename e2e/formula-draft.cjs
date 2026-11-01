const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage();let requests=0;
 page.on('request',r=>{if(r.url().endsWith('/api/analyze'))requests++;});
 await page.goto('http://127.0.0.1:8765');
 await page.locator('.js-plotly-plot').first().waitFor();
 await page.waitForTimeout(600);
 const input=page.getByTestId('g-input');const before=requests;
 await input.fill('1/(s+');await page.waitForTimeout(400);
 assert.equal(requests,before,'typing must not request analysis');
 assert.match(await page.locator('form').innerText(),/ERROR[\s\S]*Falta cerrar/);
 await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
 await page.waitForTimeout(250);assert.equal(requests,before,'invalid submission blocked');
 await input.fill('2/(s+3)');
 assert.ok(await page.locator('form .katex').count(),'live math preview');
 await page.waitForTimeout(250);assert.equal(requests,before);
 const response=page.waitForResponse(r=>r.url().endsWith('/api/analyze'));
 await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
 assert.equal((await response).status(),200);
 console.log('PASS: live preview, no requests while typing, local errors, blocked invalid submit, explicit valid submit.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
