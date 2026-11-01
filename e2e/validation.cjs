/* Fail-soft browser checks that mirror the MATLAB-backed API fixtures. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const catalog = require(path.join(root, 'validation', 'matlab', 'cases.json'));
const base = process.env.CONTROLLAB_URL || 'http://127.0.0.1:8765';
const outputFile = process.argv.includes('--result-file')
  ? process.argv[process.argv.indexOf('--result-file') + 1]
  : path.join(__dirname, 'artifacts', 'web-validation.json');
const rows = [];

async function check(name, fn) {
  try {
    const result = await fn();
    rows.push({case: name, check: result.check, status: 'PASS', expected: result.expected,
      actual: result.actual, error: result.error ?? 0, tolerance: result.tolerance ?? 'exact', detail: ''});
  } catch (error) {
    rows.push({case: name, check: error.check || 'browser validation', status: 'FAIL',
      expected: error.expected ?? '—', actual: error.actual ?? '—', error: '—', tolerance: '—',
      detail: `${error.name}: ${error.message}`});
  }
}

function requestMatches(response, expected) {
  if (!response.url().endsWith('/api/analyze') || response.request().method() !== 'POST') return false;
  try {
    const body = response.request().postDataJSON();
    return Object.entries(expected).every(([key, value]) => body[key] === value);
  } catch { return false; }
}

async function configuredPage(browser, id, payload) {
  const page = await browser.newPage({viewport: {width: 1600, height: 1000}});
  const external = [];
  const errors = [];
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    if (!['127.0.0.1', 'localhost'].includes(host)) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForSelector('#bode-chart[data-revision]');
  let expected;
  if (payload.mode === 'direct') {
    await page.getByRole('button', {name: 'GH directo', exact: true}).click();
    expected = {mode: 'direct', l: payload.l, k: payload.k};
    const pending = page.waitForResponse(response => requestMatches(response, expected), {timeout: 20000});
    await page.getByLabel('L(s)', {exact: true}).fill(payload.l);
    await page.getByLabel('Valor de K', {exact: true}).fill(String(payload.k));
    const response = await pending;
    return {page, response, data: await response.json(), external, errors};
  }
  await page.getByRole('button', {name: 'G y H separados', exact: true}).click();
  expected = {mode: 'separate', g: payload.g, h: payload.h, k: payload.k};
  const pending = page.waitForResponse(response => requestMatches(response, expected), {timeout: 20000});
  await page.getByLabel('G(s)', {exact: true}).fill(payload.g);
  await page.getByLabel('H(s)', {exact: true}).fill(payload.h);
  await page.getByLabel('Valor de K', {exact: true}).fill(String(payload.k));
  const response = await pending;
  return {page, response, data: await response.json(), external, errors};
}

async function waitChart(page, id, revision) {
  await page.waitForFunction(({id, revision}) => {
    const node = document.getElementById(id);
    return node && node.dataset.revision === String(revision) && node.data?.length;
  }, {id, revision}, {timeout: 20000});
}

async function compareBode(page, data) {
  await waitChart(page, 'bode-chart', data.revision);
  const plotted = await page.evaluate(() => {
    const chart = document.getElementById('bode-chart');
    return {omega: Array.from(chart.data[0].x), magnitude: Array.from(chart.data[0].y),
      phaseOmega: Array.from(chart.data[1].x), phase: Array.from(chart.data[1].y)};
  });
  assert.deepEqual(plotted.omega, data.bode.omega, 'Bode magnitude x values differ from API');
  assert.deepEqual(plotted.magnitude, data.bode.magnitude, 'Bode magnitude y values differ from API');
  assert.deepEqual(plotted.phaseOmega, data.bode.omega, 'Bode phase x values differ from API');
  assert.deepEqual(plotted.phase, data.bode.phase, 'Bode phase y values differ from API');
}

function sortedRoots(values) {
  return values.map(root => [Number(root.re.toFixed(7)), Number(root.im.toFixed(7))])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

async function run() {
  const browserRuns = [
    {id: 'C01 step', payload: catalog.cases[0].runs[0].payload, temporal: 'step'},
    {id: 'C01 ramp', payload: catalog.cases[0].runs[1].payload, temporal: 'ramp'},
    {id: 'C01 impulse', payload: catalog.cases[0].runs[2].payload, temporal: 'impulse'},
    ...catalog.cases[1].runs.map(run => ({id: `C02 ${run.name}`, payload: run.payload, locus: true})),
    {id: 'C08 G/H', payload: catalog.cases[7].runs[0].payload},
    {id: 'C08 GH', payload: catalog.cases[7].runs[1].payload, direct: true},
  ];
  let browser;
  try {
    browser = await chromium.launch({headless: true,
      ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {channel: 'chrome'})});
  } catch (error) {
    for (const item of browserRuns) rows.push({case: item.id, check: 'iniciar navegador', status: 'FAIL',
      expected: 'Chrome disponible', actual: 'no inició', error: '—', tolerance: '—', detail: error.message});
    return;
  }

  for (const item of browserRuns) {
    let session;
    await check(item.id, async () => {
      session = await configuredPage(browser, item.id, item.payload);
      assert.equal(session.response.status(), 200);
      await compareBode(session.page, session.data);
      assert.deepEqual(session.external, [], 'La página pidió recursos externos');
      assert.deepEqual(session.errors, [], 'La página lanzó una excepción');
      return {check: 'Bode UI = respuesta HTTP', expected: 'mismos omega/magnitud/fase', actual: 'coinciden'};
    });

    if (item.locus && session) {
      await check(item.id, async () => {
        await session.page.getByRole('button', {name: /Lugar de las raíces/i}).click();
        await waitChart(session.page, 'lgr-chart', session.data.revision);
        const plotted = await session.page.evaluate(() => {
          const chart = document.getElementById('lgr-chart');
          const closed = chart.data.find(trace => String(trace.name).startsWith('Polos para K='));
          return closed ? {x: Array.from(closed.x), y: Array.from(closed.y)} : null;
        });
        assert.ok(plotted, 'No se encontró la traza de polos cerrados');
        assert.deepEqual(sortedRoots(plotted.x.map((re, i) => ({re, im: plotted.y[i]}))),
          sortedRoots(session.data.locus.closedPoles), 'Los polos del LGR no coinciden con la API');
        return {check: 'Polos cerrados del LGR UI = API', expected: 'raíces coincidentes', actual: 'coinciden'};
      });
    }

    if (item.temporal && session) {
      await check(item.id, async () => {
        await session.page.getByRole('button', {name: /Respuesta temporal/i}).click();
        let analysis = session.data;
        if (item.temporal !== 'step') {
          const pending = session.page.waitForResponse(response => requestMatches(response, {
            mode: 'separate', g: item.payload.g, h: item.payload.h, k: item.payload.k,
          }) && response.request().postDataJSON().temporal.signal === item.temporal, {timeout: 20000});
          await session.page.getByLabel('Señal de entrada', {exact: true}).selectOption(item.temporal);
          const response = await pending;
          analysis = await response.json();
        }
        await waitChart(session.page, 'temporal-chart', analysis.revision);
        const plotted = await session.page.evaluate(() => Array.from(document.getElementById('temporal-chart').data[1].y));
        assert.deepEqual(plotted, analysis.temporal.output, 'La curva temporal no coincide con la API');
        return {check: `Respuesta ${item.temporal} UI = API`, expected: 'mismos puntos', actual: 'coinciden'};
      });
    }

    if (item.direct && session) {
      await check(item.id, async () => {
        assert.equal(session.data.models.t, null, 'GH directo no debe inferir T');
        await session.page.getByRole('button', {name: /Respuesta temporal/i}).click();
        assert.match(await session.page.locator('.empty').innerText(), /G|H|C\/R/);
        return {check: 'GH directo advierte que T no está determinado', expected: 'T null y aviso', actual: 'conforme'};
      });
    }
    if (session) await session.page.close().catch(() => {});
  }

  await check('Entrada inválida', async () => {
    const page = await browser.newPage({viewport: {width: 1600, height: 1000}});
    await page.goto(base);
    await page.waitForSelector('#bode-chart[data-revision]');
    await page.waitForFunction(() => {
      const chart = document.getElementById('bode-chart');
      return chart?.data?.[0]?.y?.length > 0;
    }, null, {timeout: 20000});
    const before = await page.evaluate(() => Array.from(document.getElementById('bode-chart').data[0].y));
    const field = page.getByLabel('G(s)', {exact: true});
    await field.fill('1/(');
    await page.getByRole('alert').waitFor();
    const after = await page.evaluate(() => Array.from(document.getElementById('bode-chart').data[0].y));
    assert.deepEqual(after, before, 'La entrada inválida reemplazó la última curva válida');
    await page.close();
    return {check: 'UI conserva último análisis válido', expected: 'curva sin cambios', actual: 'sin cambios'};
  });

  await browser.close();
}

(async () => {
  await fs.mkdir(path.dirname(path.resolve(outputFile)), {recursive: true});
  await run();
  const summary = {status: rows.every(row => row.status === 'PASS') ? 'PASS' : 'FAIL', rows};
  await fs.writeFile(outputFile, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary));
  if (summary.status !== 'PASS') process.exitCode = 1;
})().catch(async error => {
  rows.push({case: 'E2E', check: 'suite', status: 'FAIL', expected: 'suite terminada', actual: 'error global',
    error: '—', tolerance: '—', detail: `${error.name}: ${error.message}`});
  const summary = {status: 'FAIL', rows};
  await fs.mkdir(path.dirname(path.resolve(outputFile)), {recursive: true});
  await fs.writeFile(outputFile, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary));
  process.exitCode = 1;
});
