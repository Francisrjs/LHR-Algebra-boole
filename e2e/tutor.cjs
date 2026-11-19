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
  const assisted = async () => {
    const before = await step();
    await button("Resolver este paso").click();
    assert.equal(await step(),before);
    if (await page.locator(".tutor-current-answer input[type=radio]").count()) {
      assert.equal(await page.locator(".tutor-current-answer input:checked").count(),1);
    }
    assert.ok(await page.locator(".tutor-revealed strong").innerText());
    assert.equal(await button("Continuar (Enter)").evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press("Enter");
  };
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
    assert.equal(await page.locator("[data-exercise]").count(),54);
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
    assert.deepEqual(await layers(),["Ganancia · 0 dB"]);
    assert.ok(await page.locator(".tutor-formula mfrac").count());
    const radioIndex = await page.getByRole("radio",{name:"Polo simple",exact:true}).evaluate(el =>
      [...el.form.querySelectorAll("input[type=radio]")].indexOf(el)+1);
    assert.equal(await page.locator("input[type=radio]:focus").count(),1);
    await page.keyboard.press(String(radioIndex));
    await page.keyboard.press("Enter");
    assert.equal(await input().evaluate(el=>el===document.activeElement),true);
    assert.ok(await page.locator(".tutor-decade msup").count());
    assert.ok((await layers()).some(label => label.includes("× Polo simple en el origen · ω = 0 · -20 dB/década")));
    await button("Ampliar").tap();
    await page.keyboard.press("Alt+2");
    assert.equal(await button("Fase").getAttribute("aria-pressed"),"true");
    await page.keyboard.press("Alt+1");
    assert.equal(await button("Magnitud").getAttribute("aria-pressed"),"true");
    await page.keyboard.press("Alt+p");
    assert.equal(await page.locator("dialog[open]").count(),0);
    assert.ok(await page.getByText("Cada cero suma 20 y cada polo resta 20 dB/década.",{exact:true}).isVisible());
    await input().focus();
    await page.keyboard.type("-20db/dc");
    await page.keyboard.press("Enter");
    assert.ok(await page.locator(".tutor-graph text").allTextContents().then(labels=>labels.includes("-20 dB/déc")));
    assert.equal(await input().evaluate(el=>el===document.activeElement),true);
    assert.ok((await layers()).some(label => label.includes("-20 dB/década")));
    await answer("40");
    assert.ok((await layers()).some(label => label.includes("40 dB a 0.01 rad/s")));
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
    await advanceTo("Quiebre");
    await answer("1000");
    assert.ok((await layers()).some(label => label.includes("× Polo simple · 1000 rad/s")));
    await advanceTo("Cambio de pendiente");
    const levels = await page.locator('.tutor-graph circle[fill="#ff394b"] + text').allTextContents();
    assert.equal(levels.at(-1),"-40");
    assert.ok(!levels.includes("-80") && !levels.includes("-140"));
    assert.deepEqual(await page.locator("[data-confirmed-frequency]").evaluateAll(nodes=>nodes.map(n=>n.dataset.confirmedFrequency)),["0.01","100"]);
    await advanceTo("Suma de fase");
    await assisted();
    assert.match(await step(),/Paso 38 /);
    const confirmedAtTen = page.locator('[data-confirmed-frequency="10"]');
    assert.equal(await confirmedAtTen.count(),0);
    assert.equal(await page.locator(".tutor-decade").count(),1);
    await answer("123");
    assert.equal(await confirmedAtTen.count(),0);
    await answer("-90");
    assert.equal(await confirmedAtTen.count(),1);
    assert.equal(await page.locator(".tutor-decade").count(),2);
    await page.setViewportSize({width:390,height:844});
    await finishPractice();
    await button("Magnitud").tap();
    await button("Suma por rectas").tap();
    assert.ok((await layers()).includes("Magnitud total"));
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
    await advanceTo("Despeje de K");
    assert.equal(await page.getByRole("radio").count(),3);
    await assisted();
    assert.match(await step(),/Derivar D/);
    await page.reload();
    assert.match(await step(),/Derivar D/);
    await advanceTo("Ganancia de ruptura");
    await answer("0,6311");
    await advanceTo("Ganancia crítica");
    assert.ok((await layers()).includes("△ Centroide"));
    assert.ok(!(await layers()).includes("• Cruce imaginario"));
    await answer("12");
    await advanceTo("Cruce imaginario");
    await answer("sqrt(3) rad/s");
    assert.ok((await layers()).includes("• Cruce imaginario"));
    await button("Practicar solo Routh").tap();
    assert.equal(await page.getByRole("img",{name:"Plano complejo del lugar de las raíces"}).count(),0);

    await button("← Índice").tap();
    await button("Empezar D12").tap();
    const schema = page.locator(".tutor-visual").getByRole("combobox");
    await answer("G2/(1-G2)");
    assert.match(await schema.locator("option:checked").innerText(),/Positivo/);
    await page.reload();
    assert.match(await schema.locator("option:checked").innerText(),/Positivo/);
    await answer("G1*G2/(1-G2)");
    assert.match(await schema.locator("option:checked").innerText(),/Serie/);
    await answer("G1*G2/(1-G2+G1*G2)");
    assert.equal(await page.getByRole("heading",{name:"Resultado del intento"}).isVisible(),true);
    await button("← Índice").tap();
    await button("Empezar D15").tap();
    const diagram = page.getByRole("group",{name:/^Diagrama de bloques/});
    assert.match(await diagram.getAttribute("aria-label"),/nodo x a H1/);
    await answer("G*H1");
    await answer("G+H2");
    await answer("1/(1+G*H1)");
    await answer("(G+H2)/(1+(G+H2)*H1)");
    assert.match(await step(),/serie/);
    await answer("(H2+G)/(G*H1+1)");
    assert.equal(await page.getByRole("heading",{name:"Resultado del intento"}).isVisible(),true);
    assert.equal(await noHorizontalOverflow(),true);

    await button("← Índice").tap();
    await button("Empezar E3").tap();
    await input().fill("10/(");
    assert.match(await page.getByLabel("Vista previa",{exact:true}).innerText(),/Falta/);
    for(const width of [768,1440,390]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await noHorizontalOverflow(),true);
      await page.screenshot({path:path.join(output,`tutor-laplace-${width}.png`)});
    }
    for (const value of ["10/s","10/(s*(s+1)*(s+2))","5","-10","5","5*(1-exp(-t))^2","5","5"]) await answer(value);
    assert.match(await page.locator(".tutor-card").innerText(),/Completado sin ayuda/);
    await button("← Índice").tap();
    await button("Empezar B6").tap();
    await advanceTo("Magnitud inicial");
    await page.setViewportSize({width:1440,height:900});
    assert.equal(await page.locator('polyline[stroke="#ff394b"]').count(),0);
    const bodePanel = page.locator(".tutor-visual-scroll").locator("..");
    await bodePanel.screenshot({path:path.join(output,"b6-aportes-magnitud.png")});
    await button("Fase").tap();
    await bodePanel.screenshot({path:path.join(output,"b6-aportes-fase.png")});
    assert.ok((await layers()).some(label => label.includes("Par de ceros complejos") && label.includes("180°")));
    await button("Magnitud").tap();
    await assisted();
    const redPoints = () => page.locator('polyline[stroke="#ff394b"]').getAttribute("points");
    assert.equal((await redPoints()).split(" ").length,1);
    await advanceTo("Continuidad");
    assert.equal((await redPoints()).split(" ").length,1);
    await assisted();
    assert.ok((await redPoints()).split(" ").length > 1);
    await advanceTo("Suma de fase");
    await assisted();
    assert.equal((await redPoints()).split(" ").length,1);
    await assisted();
    assert.equal((await redPoints()).split(" ").length,2);
    await finishPractice();
    await button("Fase").tap();
    await button("Magnitud").focus();
    await page.keyboard.press("Alt+3");
    assert.equal(await button("Aportes individuales").getAttribute("aria-pressed"),"true");
    await page.keyboard.press("Alt+4");
    assert.equal(await button("Suma por rectas").getAttribute("aria-pressed"),"true");
    await bodePanel.screenshot({path:path.join(output,"b6-suma-fase.png")});
    const phasePlot = page.getByRole("img",{name:"Fase en grados"});
    assert.equal(await phasePlot.locator("polyline").last().getAttribute("stroke"),"#ff394b");
    assert.ok(await phasePlot.locator("polyline").count()>1);
    for (const angle of ["-90°","-45°","-135°","-225°","-270°"])
      assert.ok(await phasePlot.locator("circle + text").allTextContents().then(labels=>labels.includes(angle)));
    assert.deepEqual(errors,[]);
    console.log("Tutor: 54 ID; B1 completo y persistencia, examen R1, L5, D15 y E3; 360 y 390 px.");
  } finally {
    await browser.close();
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
