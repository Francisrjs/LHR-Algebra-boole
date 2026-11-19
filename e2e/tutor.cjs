const {chromium} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const base = process.env.CONTROLLAB_URL || "http://127.0.0.1:8765";
const output = path.join(__dirname,"artifacts");

async function run() {
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?
    {executablePath:process.env.CHROME_PATH}:{channel:"chrome"})});
  const context = await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror",error=>errors.push(error.message));
  const button = name=>page.getByRole("button",{name,exact:true});
  const input = ()=>page.getByRole("textbox",{name:"Tu respuesta",exact:true});
  const step = ()=>page.locator(".tutor-step").innerText();
  const layers = ()=>page.locator('[aria-label="Trazos confirmados"] li, [aria-label="Elementos confirmados"] li').allTextContents();
  const answer = async (value,action="Confirmar")=>{
    const field = input();
    if(await field.count()) await field.fill(value);
    else await page.getByRole("radio",{name:value,exact:true}).check();
    await button(action).click();
  };
  const assisted = () => button("Resolver este paso").click();
  const advanceTo = async (exerciseConcept,max=80)=>{
    for(let i=0;i<max;i++){
      if((await step()).includes(exerciseConcept)) return;
      await assisted();
    }
    assert.fail("No se encontró el paso de "+exerciseConcept);
  };
  const finishPractice = async ()=>{
    for(let i=0;i<100;i++){
      if(await page.getByRole("heading",{name:"Resultado del intento"}).isVisible()) return;
      await assisted();
    }
    assert.fail("El intento no finalizó");
  };
  const noHorizontalOverflow = ()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);
  try {
    await page.goto(base);
    await button("Tutor").tap();
    await button("Empezar B1").waitFor();
    assert.equal(await page.locator("[data-exercise]").count(),33);
    assert.equal(await noHorizontalOverflow(),true);
    await page.screenshot({path:path.join(output,"tutor-indice-360.png")});
    await button("Empezar B1").tap();
    assert.deepEqual(await layers(),[]);
    const first = await step();
    await button("Mostrar teclado matemático").tap();
    await input().fill("12");
    await input().evaluate(field => field.setSelectionRange(1, 1));
    await button("Insertar ,").tap();
    assert.equal(await input().inputValue(), "1,2");
    await button("Ocultar teclado matemático").tap();
    await answer("100");
    assert.equal(await step(),first);
    assert.match(await page.locator(".tutor-help").last().innerText(),/probá otra vez/);
    await button("Ver pista").tap();
    await page.reload();
    assert.equal(await step(),first);
    assert.equal(await input().inputValue(),"100");
    await input().fill("10^5/(100*1000)");
    await page.locator(".tutor form").evaluate(form=>{form.requestSubmit();form.requestSubmit();});
    assert.match(await step(),/Paso 2 /);
    await answer("0 dB");
    assert.deepEqual(await layers(),["Ganancia"]);
    await advanceTo("Quiebre");
    await button("Ampliar").tap();
    await page.getByRole("dialog", {name:"Construcción gráfica ampliada"}).waitFor();
    const graph = page.getByRole("img",{name:"Magnitud en dB"});
    const xy = await graph.evaluate(el=>{
      const p = new DOMPoint(53+(465-53)*4/6,130).matrixTransform(el.getScreenCTM());
      const rect = el.getBoundingClientRect();
      return {x:p.x-rect.x,y:p.y-rect.y};
    });
    await graph.evaluate((el, x) => {
      const scroller = el.parentElement;
      scroller.scrollLeft = Math.max(0, x - scroller.clientWidth / 2);
    },xy.x);
    await graph.tap({position:xy});
    await page.keyboard.press("Escape");
    assert.equal(await button("Ampliar").evaluate(el=>el===document.activeElement),true);
    assert.ok(Math.abs(Math.log10(Number(await input().inputValue())/100))<.055);
    await button("Confirmar").tap();
    assert.match(await step(),/Pendiente/);
    await button("Fase").tap();
    await page.reload();
    assert.equal(await button("Fase").getAttribute("aria-pressed"),"true");
    await button("Magnitud").tap();
    assert.ok((await layers()).some(s=>s.includes("Origen")));
    await page.setViewportSize({width:390,height:844});
    await finishPractice();
    assert.ok((await layers()).some(s=>s.includes("exacta")));
    await page.screenshot({path:path.join(output,"tutor-bode-390.png"),fullPage:true});
    assert.equal(await noHorizontalOverflow(),true);
    await button("Marcar para repaso").tap();
    await button("Repetir ejercicio").tap();
    assert.match(await step(),/Paso 1 /);
    assert.deepEqual(await layers(),[]);
    assert.equal(await page.getByText("Historial de intentos",{exact:true}).isVisible(),true);

    await button("← Índice").tap();
    await page.getByLabel("Dificultad",{exact:true}).selectOption("Examen");
    await button("Empezar R1").tap();
    const routh = ["s^3+3s^2+2s+K","1","2","3","K","(6-K)/3","0","K","0 < K < 6","6","3s^2+6","sqrt(2)","Un par pasa al semiplano derecho"];
    for(const value of routh) {
      assert.equal(await button("Ver pista").count(),0);
      assert.equal(await page.getByText("Ver resolución completa",{exact:true}).count(),0);
      assert.match(await page.getByRole("table",{name:"Tabla de Routh"}).innerText(),/—/);
      await answer(value,"Guardar respuesta");
    }
    await button("Entregar y corregir").tap();
    assert.match(await page.getByText(/respuestas correctas/).innerText(),/13 de 13/);
    assert.match(await page.getByRole("table",{name:"Tabla de Routh"}).innerText(),/6-K/);
    await page.getByText("Pasos respondidos",{exact:true}).tap();
    assert.match(await page.locator(".tutor-card li").first().innerText(),/Correcto/);

    await button("← Índice").tap();
    await page.getByLabel("Dificultad",{exact:true}).selectOption("Intermedio");
    await button("Empezar L5").tap();
    await answer("-3");
    assert.ok((await layers()).includes("× Polo"));
    await advanceTo("Ganancia crítica");
    assert.ok((await layers()).includes("△ Centroide"));
    assert.ok(!(await layers()).includes("• Cruce imaginario"));
    await answer("12");
    await assisted();
    await answer("sqrt(3) rad/s");
    assert.ok((await layers()).includes("• Cruce imaginario"));
    await button("Practicar solo Routh").tap();
    assert.equal(await page.getByRole("img",{name:"Plano complejo del lugar de las raíces"}).count(),0);

    await button("← Índice").tap();
    await button("Empezar D15").tap();
    const diagram = page.getByRole("group",{name:/^Diagrama de bloques/});
    assert.match(await diagram.getAttribute("aria-label"),/nodo x a H1/);
    await diagram.getByRole("button",{name:"Seleccionar G",exact:true}).press("Enter");
    await button("Confirmar").tap();
    await answer("H1*G*e1");
    await answer("G+H2");
    await answer("(G+H2)/(1+(G+H2)*H1)");
    assert.match(await step(),/Equivalente/);
    await answer("(H2+G)/(G*H1+1)");
    assert.equal(await page.getByRole("heading",{name:"Resultado del intento"}).isVisible(),true);
    assert.equal(await noHorizontalOverflow(),true);

    await button("← Índice").tap();
    await button("Empezar E3").tap();
    await input().fill("10/(");
    assert.equal(await page.getByLabel("Vista previa",{exact:true}).innerText(),"10/(");
    for(const width of [768,1440,390]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await noHorizontalOverflow(),true);
      await page.screenshot({path:path.join(output,`tutor-laplace-${width}.png`)});
    }
    for (const value of ["10/s","10/(s*(s+1)*(s+2))","5","-10","5","5*(1-exp(-t))^2","5","5"]) await answer(value);
    assert.match(await page.locator(".tutor-card").innerText(),/Completado sin ayuda/);
    assert.deepEqual(errors,[]);
    console.log("Tutor: 33 ID; B1 completo y persistencia, examen R1, L5, D15 y E3; 360 y 390 px.");
  } finally {
    await browser.close();
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
