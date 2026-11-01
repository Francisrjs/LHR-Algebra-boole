const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  await page.goto(process.env.CONTROLLAB_URL||'http://127.0.0.1:8765');await page.waitForSelector('#bode-chart[data-revision]');
  await page.getByLabel('G(s)',{exact:true}).fill('1/((s+1)*(s+2)*(s+3)*(s+4)*(s+5)*(s+6))');await page.waitForTimeout(600);
  const samples=[];
  for(let k=2;k<=31;k++)samples.push(await page.evaluate(value=>new Promise((resolve,reject)=>{
   const chart=document.getElementById('bode-chart'),prior=chart.dataset.revision,input=document.querySelector('[aria-label="Valor de K"]'),start=performance.now();
   const observer=new MutationObserver(()=>{if(chart.dataset.revision!==prior){observer.disconnect();clearTimeout(timeout);resolve(performance.now()-start)}});
   const timeout=setTimeout(()=>{observer.disconnect();reject(Error('render timeout'))},10000);
   observer.observe(chart,{attributes:true,attributeFilter:['data-revision']});
   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));
  }),k));
  const sorted=[...samples].sort((a,b)=>a-b);
  console.log(JSON.stringify({modelOrder:6,count:samples.length,medianMs:sorted[15],p95Ms:sorted[28],maxMs:sorted[29],below300:samples.every(x=>x<300),samples},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
