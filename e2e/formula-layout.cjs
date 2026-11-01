const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:8765');
  await page.locator('.formula-preview-math').first().waitFor();
  for(const width of [1600,1100,768,390]){
   await page.setViewportSize({width,height:1000});
   for(const expression of ['1/(s*(s+1)*(s+3))','1','K(s+1)^2(s+100)^2/(s^3(s+10)(s+100))','1/(s+']){
    await page.getByTestId('g-input').fill(expression);
    const dimensions=await page.locator('.formula-preview').first().evaluate(el=>{
     const rect=el.getBoundingClientRect();const parent=el.parentElement.getBoundingClientRect();
     return {display:getComputedStyle(el).display,height:rect.height,left:rect.left,right:rect.right,parentLeft:parent.left,parentRight:parent.right};
    });
    assert.equal(dimensions.display,'block');assert.ok(dimensions.height>65);
    assert.ok(dimensions.left>=dimensions.parentLeft-1 && dimensions.right<=dimensions.parentRight+1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow at '+width);
   }
  }
  await page.setViewportSize({width:1600,height:1000});
  await page.getByTestId('g-input').fill('1/(s*(s+1)*(s+3))');
  await page.locator('.editorcolumn').screenshot({path:'e2e/artifacts/formula-preview-fixed.png'});
  await page.getByRole('button',{name:'GH directo',exact:true}).click();
  await page.getByTestId('l-input').fill('K(s+1)^2(s+100)^2/(s^3(s+10)(s+100))');
  assert.ok(await page.locator('.formula-preview .katex').count());
  console.log('PASS: formula cards, constants, long expressions, errors, direct mode and responsive widths 390/768/1100/1600.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
