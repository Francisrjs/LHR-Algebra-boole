const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const base = process.env.CONTROLLAB_URL || "http://127.0.0.1:8765";
const output = path.join(__dirname, "artifacts");

// References from the handout and its errata, independent of the rendered answers.
const groups = [
  ["Álgebra de bloques", [1, 1, 1, 1, 2], [
    [["como una expresión única", "4/(s^2+11s+38)"]],
    [["signo entra", "Positivo"], ["como una expresión única", "-2(s+1)/(s^2+4s+1)"]],
    [["como una expresión única", "5/(s^2+8s+2)"]],
    [["como una expresión única", "6(s+3)/(s^3+6s^2+14s+21)"]],
    [["toma alimenta", ".Y"], ["como una expresión única", "6/(s^2+6s+14)"]],
  ]],
  ["Laplace y error estacionario", [3, 3, 3, 3, 3], [
    [["para t ≥ 0", "10-30exp(-2t)+20exp(-3t)"], ["error estacionario de seguimiento", "0"]],
    [["para t ≥ 0", "4-(4+12t)*exp(-3t)"], ["error estacionario de seguimiento", "0"]],
    [["para t ≥ 0", "(50/13)*(1-exp(-2t)*(cos(3t)+2sin(3t)/3))"], ["error estacionario de seguimiento", "15/13"]],
    [["para t ≥ 0", "2t-1+exp(-2t)"], ["error estacionario de seguimiento", "1"]],
    [["para t ≥ 0", "8-8exp(-6t)"], ["error estacionario de seguimiento", "-2"], ["error estacionario del comparador", "+2"]],
  ]],
  ["Bode directo", [4, 4, 4, 4, 5], [
    [["exacto con 0 dB", "7,798"], ["exacto con −180°", "33,317"], ["analizar D+N", "Estable"]],
    [["exacto con 0 dB", "9,480"], ["exacto con −180°", "4,472"], ["analizar D+N", "Inestable"]],
    [["primer encuentro exacto con 0 dB", "0,32441"], ["sentido atraviesa", "Ascendente"],
      ["segundo encuentro exacto con 0 dB", "308,252"], ["sentido atraviesa", "Descendente"],
      ["MG exacto", "Infinito"], ["analizar D+N", "Estable"]],
    [["exacto con 0 dB", "26,518"], ["exacto con −180°", "5,657"], ["analizar D+N", "Inestable"]],
    [["dB aporta solo", "0"], ["fase exacta a", "90"], ["exacto con 0 dB", "3083,373"], ["MG exacto", "Infinito"], ["analizar D+N", "Estable"]],
  ]],
  ["Routh y LGR", [6, 6, 6, 6, 7], [
    [["ruptura real 1", "-1,8453"], ["estrictamente estable", "0 < K < 192"], ["frecuencia positiva", "sqrt(23)"]],
    [["ruptura real interior", "Ninguna"], ["estrictamente estable", "Todo K > 0"]],
    [["ruptura real 1", "-3"], ["corresponde a esa ruptura", "9"], ["estrictamente estable", "Todo K > 0"]],
    [["ruptura real 1", "-2,6180"], ["ruptura real 2", "-0,3820"], ["estrictamente estable", "0 < K < 10"], ["fila sobre la fila nula", "10s^2+10"], ["frecuencia positiva", "1"]],
    [["centroide", "+0,5"], ["ruptura real 1", "-0,45474"], ["estrictamente estable", "0 < K < 6"], ["frecuencia positiva", "sqrt(8)"]],
  ]],
];

async function run() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 850 }, isMobile: true, hasTouch: true });
    const errors = [];
    const locusRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (!response.url().endsWith("/api/analyze")) return;
      const request = response.request().postDataJSON();
      if (request?.mode === "direct" && request.l) locusRequests.push(response);
    });
    const button = (name) => page.getByRole("button", { name, exact: true });
    const field = page.getByRole("textbox", { name: "Tu respuesta", exact: true });
    const currentPrompt = page.locator(".tutor-step + h2");
    const step = page.locator(".tutor-step");
    const complete = page.getByRole("heading", { name: "Resultado del intento" });
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    const fill = async (answer) => {
      if (await field.count()) await field.fill(answer);
      else await page.getByRole("radio", { name: answer, exact: true }).check();
    };
    async function tapGraph(name, x, y, expected, tolerance) {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 850 });
        const graph = page.getByRole("img", { name, exact: true });
        assert.match(await graph.getAttribute("class"), /tutor-pick/);
        await graph.scrollIntoViewIfNeeded();
        const point = await graph.evaluate((svg, [px, py]) => {
          const screen = new DOMPoint(px, py).matrixTransform(svg.getScreenCTM());
          return { x: screen.x, y: screen.y };
        }, [x, y]);
        await page.touchscreen.tap(point.x, point.y);
        const draft = await field.inputValue();
        assert.ok(Math.abs(Number(draft) - expected) < tolerance, `${name}, ${width}px: se leyó ${draft}`);
        assert.equal(await noOverflow(), true, name);
      }
    }
    await page.goto(base);
    await button("Tutor").click();
    await button("Empezar P1.1").waitFor();
    assert.equal(await page.locator("[data-exercise]").count(), 54);
    assert.equal(await page.evaluate(() => localStorage.getItem("controllab.tutor.v1")), null);
    for (const [family, [topic, pages, references]] of groups.entries()) {
      const theme = page.getByRole("combobox", { name: "Tema" });
      await theme.selectOption(topic);
      assert.equal(await page.getByRole("heading", { name: "Práctica tipo parcial" }).count(), 1);
      assert.equal(await page.locator('[data-exercise^="P"]').count(), 5);
      assert.equal(await noOverflow(), true);
      for (const [index, reference] of references.entries()) {
        const id = `P${family + 1}.${index + 1}`;
        const row = page.locator(`[data-exercise="${id}"]`);
        assert.ok((await row.innerText()).includes(`p. ${pages[index]}`), id);
        assert.ok((await row.innerText()).includes("Pendiente"), id);
        assert.ok((await button("Empezar " + id).boundingBox()).height >= 44, id);
        await button("Empezar " + id).click();
        let checkpoint = 0;
        let retried = false;
        for (let i = 0; i < 100 && !(await complete.isVisible()); i++) {
          const before = await step.innerText();
          const prompt = await currentPrompt.innerText();
          if (id === "P1.1" && i === 0) {
            await page.getByRole("button", { name: "Seleccionar .X", exact: true }).focus();
            await page.keyboard.press("Enter");
            await page.locator(".tutor form").first().evaluate((form) => {
              form.requestSubmit();
              form.requestSubmit();
            });
            assert.match(await step.innerText(), /Paso 2 /);
          } else if (reference[checkpoint] && prompt.includes(reference[checkpoint][0])) {
            if (!retried || id === "P2.5" && checkpoint === 2) {
              const distractors = { "P1.2": "Negativo", "P1.5": ".X", "P4.2": "Una" };
              const incorrect = id === "P2.5" && checkpoint === 2 ? "1,2" : distractors[id] ?? "99999";
              await fill(incorrect);
              await button("Confirmar").click();
              assert.equal(await step.innerText(), before, id);
              if (await field.count()) assert.equal(await field.inputValue(), incorrect, id);
              else assert.ok(await page.getByRole("radio", { name: incorrect, exact: true }).isChecked(), id);
              await button("Ver pista").click();
              if (id === "P1.1") {
                await page.reload();
                assert.equal(await step.innerText(), before, id);
                assert.equal(await field.inputValue(), incorrect, id);
              }
              retried = true;
            }
            if (id === "P3.1" && checkpoint === 0) {
              await button("Magnitud").click();
              const legend = page.getByRole("list", { name: "Trazos confirmados" });
              assert.ok(await legend.getByText("Magnitud exacta", { exact: true }).isVisible());
              assert.equal(await legend.getByText("Cruce a 7.798 rad/s", { exact: true }).count(), 0);
              await tapGraph("Magnitud en dB", 53 + (Math.log10(7.798) + 2) * 412 / 6, 117, 7.798, 0.25);
            }
            if (id === "P4.1" && checkpoint === 0) {
              await tapGraph("Plano complejo del lugar de las raíces", 45 + (7 - 1.8453) * 410 / 13, 196, -1.8453, 0.04);
            }
            await fill(reference[checkpoint++][1]);
            await button("Confirmar").click();
            if (id === "P3.1" && checkpoint === 1) {
              const legend = page.getByRole("list", { name: "Trazos confirmados" });
              assert.ok(await legend.getByText("Cruce a 7.798 rad/s", { exact: true }).isVisible());
            }
          } else {
            await button("Resolver este paso").click();
            assert.equal(await step.innerText(), before, id);
            await button("Continuar (Enter)").click();
          }
          assert.notEqual(await step.count() ? await step.innerText() : "", before, `${id}: ${prompt}`);
        }
        assert.ok(await complete.isVisible(), id);
        assert.equal(checkpoint, reference.length, id);
        assert.equal(await noOverflow(), true, id);
        await page.screenshot({ path: path.join(output, `tutor-${id}.png`), fullPage: true });
        await button("← Índice").click();
        console.log(`${id}: página, resolución, ${checkpoint} respuestas de referencia y captura`);
      }
    }
    assert.equal(new Set(locusRequests.map((response) => response.request().postDataJSON().l)).size, 5);
    for (const response of locusRequests) {
      assert.ok(response.ok(), response.status());
      const analysis = await response.json();
      assert.ok(analysis.locus?.branches?.length, JSON.stringify(analysis.locus));
    }
    await page.getByRole("combobox", { name: "Dificultad" }).selectOption("Examen");
    await page.getByRole("combobox", { name: "Tema" }).selectOption("Álgebra de bloques");
    await button("Empezar P1.1").click();
    for (const answer of [".X", "Negativo", "4/(s+6)", "4/((s+5)(s+6))", "4/(s^2+11s+38)"]) {
      assert.equal(await button("Ver pista").count(), 0);
      assert.equal(await button("Resolver este paso").count(), 0);
      await fill(answer);
      await button("Guardar respuesta").click();
    }
    assert.equal(await complete.count(), 0);
    await button("Entregar y corregir").click();
    assert.ok(await page.getByText("5 de 5 respuestas correctas.").isVisible());
    await button("Repetir ejercicio").click();
    assert.match(await step.innerText(), /Paso 1 /);
    assert.ok(await page.getByText("Historial de intentos", { exact: true }).isVisible());
    await button("← Índice").click();

    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByRole("combobox", { name: "Dificultad" }).selectOption("Inicial");
    await button("Empezar P1.1").tap();
    const takeoff = page.getByRole("button", { name: "Seleccionar .X", exact: true });
    await takeoff.tap();
    assert.equal(await page.getByRole("radio", { name: ".X", exact: true }).isChecked(), true);
    assert.equal(await noOverflow(), true);
    await page.screenshot({ path: path.join(output, "tutor-parcial-toma-360.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const expand = button("Ampliar");
    await expand.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Construcción gráfica ampliada" });
    assert.ok(await dialog.isVisible());
    const close = dialog.getByRole("button", { name: "Cerrar gráfico" });
    assert.equal(await close.evaluate((element) => document.activeElement === element), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.textContent === "Ampliar");
    assert.equal(await expand.evaluate((element) => document.activeElement === element), true);
    await page.screenshot({ path: path.join(output, "tutor-parcial-foco-1440.png"), fullPage: true });

    await button("← Índice").click();
    await page.getByRole("combobox", { name: "Tema" }).selectOption("Routh y LGR");
    await page.getByRole("combobox", { name: "Dificultad" }).selectOption("Intermedio");
    await button("Abrir intento P4.4").click();
    await button("Practicar solo Routh").click();
    assert.match(await step.innerText(), /Paso 1 .*Ecuación característica/);
    assert.ok(await page.getByRole("table", { name: "Tabla de Routh" }).isVisible());
    assert.equal(await page.getByRole("img", { name: "Plano complejo del lugar de las raíces" }).count(), 0);
    await button("Práctica completa de LGR").click();
    assert.ok(await complete.isVisible());
    await button("← Índice").click();

    await page.evaluate(() => {
      const key = "controllab.tutor.v1";
      const session = JSON.parse(localStorage.getItem(key));
      session.attempts.push({
        id: "historical-d1", exercise: "D1", mode: "Intermedio", step: 1,
        complete: false, review: false, hints: [], draft: "M-N",
        log: [{ step: 0, response: "G2", outcome: "correct" }],
      });
      localStorage.setItem(key, JSON.stringify(session));
    });
    await page.reload();
    await button("Abrir intento D1").click();
    assert.match(await step.innerText(), /Paso 2 .*Señales/);
    assert.equal(await field.inputValue(), "M-N");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
