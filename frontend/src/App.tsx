import BodeWorkspace from "./BodeWorkspace";
import {factorColors,factorTraces,factorAnnotations} from "./bodePresentation";
import BodeSummary from "./BodeSummary";
import FormulaEditor from "./FormulaEditor";
import { useEffect, useRef, useState } from "react";
import type { Data, Layout } from "plotly.js";
import Chart, { exportChart } from "./Chart";
import TransferFormula from "./TransferFormula";
import BlockDiagramEditor, { type Diagram } from "./BlockDiagramEditor";
import {
  initial,
  validateProject,
  type Project,
  type Analysis,
  type Model,
  type Root,
  type ChartView,
} from "./types";
const colors = ["#40d6e7", "#a293ff", "#f5be70", "#5ecab3", "#ea7f95"];
const views = [
  ["bode", "◫", "Diagrama de Bode"],
  ["lgr", "⌁", "Lugar de las raíces"],
  ["plano", "⊗", "Polos y ceros"],
  ["temporal", "∿", "Respuesta temporal"],
  ["algebra", "⌘", "Álgebra de bloques"],
];
const fmt = (v: unknown, d = 4) =>
  typeof v === "number" && Number.isFinite(v)
    ? Number(v.toPrecision(d)).toString()
    : "—";
const rootText = (r: Root) =>
  `${fmt(r.re)} ${r.im < 0 ? "−" : "+"} ${fmt(Math.abs(r.im))}j`;
async function api(path: string, body: unknown) {
  const r = await fetch("/api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok)
    throw Error(
      typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail || d),
    );
  return d;
}
function points(
  roots: Root[] | undefined,
  name: string,
  symbol: string,
  color: string,
): Data {
  return {
    x: (roots || []).map((r) => r.re),
    y: (roots || []).map((r) => r.im),
    name,
    type: "scatter",
    mode: "markers",
    marker: { symbol, size: 12, color, line: { width: 2, color } },
  };
}
function curve(
  x: number[],
  y: (number | null)[],
  name: string,
  color: string,
  extra: Partial<Data> = {},
): Data {
  return {
    x,
    y,
    name,
    type: "scatter",
    mode: "lines",
    line: { color, width: 2.3 },
    connectgaps: false,
    ...extra,
  } as Data;
}
function Panel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      <div className="panelhead">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
export default function App() {
  const [p, setP] = useState<Project>(structuredClone(initial)),
    [result, setResult] = useState<Analysis | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [cursor, setCursor] = useState<number | null>(null),
    [undo, setUndo] = useState<Project[]>([]),
    [selected, setSelected] = useState<{
      kind: "pole" | "zero";
      index: number;
      re: number;
      im: number;
    } | null>(null),
    [rootEdit, setRootEdit] = useState({ re: 0, im: 0 }),
    [dragEnabled, setDragEnabled] = useState(false),
    [eq, setEq] = useState<Model | null>(null),
    [algebraError, setAlgebraError] = useState("");
  const resetModel = useRef<Project>(structuredClone(initial));
  const savedProject = useRef<Project | null>(null);
  const operation = p.algebra?.operation || "series",
    functions = p.algebra?.functions || ["1/(s+1)", "1/(s+2)"];
  const setOperation = (operation: string) => {
    update({ algebra: { operation, functions } });
    setEq(null);
  };
  const setFunctions = (functions: string[]) => {
    update({ algebra: { operation, functions } });
    setEq(null);
  };
  const chartChange = (id: string, view: ChartView) =>
    setP((old) => {
      const merged = { ...old.charts?.[id], ...view };
      return JSON.stringify(merged) === JSON.stringify(old.charts?.[id])
        ? old
        : { ...old, charts: { ...old.charts, [id]: merged } };
    });

  const revision = useRef(0),
    file = useRef<HTMLInputElement>(null),
    lastRequest = useRef(0),
    [elapsed, setElapsed] = useState(0);
  const update = (patch: Partial<Project>) =>
    setP((old) => ({ ...old, ...patch }));
  const parameterValues = Object.fromEntries(
    p.parameters.map((x) => [x.name, x.value]),
  );
  useEffect(() => {
    const current = ++revision.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      lastRequest.current = performance.now();
      try {
        const r = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            ...p,
            parameters: parameterValues,
            revision: current,
          }),
        });
        const data = await r.json();
        if (!r.ok)
          throw Error(
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail),
          );
        if (current !== revision.current) return;
        setResult(data);
        setError("");
        setElapsed(performance.now() - lastRequest.current);
        setSelected(null);
      } catch (e) {
        if (current === revision.current && !controller.signal.aborted)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (current === revision.current) setBusy(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    p.mode,
    p.g,
    p.h,
    p.l,
    p.k,
    JSON.stringify(p.parameters),
    p.target,
    p.temporalTarget,
    JSON.stringify(p.frequency),
    JSON.stringify(p.temporal),
  ]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const model =
      p.view === "plano" && p.mode === "direct"
        ? result?.models.l0
        : result?.models[p.target],
    b = result?.bode,
    l = result?.locus,
    t = result?.temporal;
  const bodeRange: [number, number] | undefined = b?.omega?.length
    ? [Math.log10(b.omega[0]), Math.log10(b.omega[b.omega.length - 1])]
    : undefined;
  const bodeView = {...p.charts?.["bode-chart"]};
  for (const axis of ["xaxis", "xaxis2"] as const) {
    if (bodeView[axis]?.autorange && bodeRange)
      bodeView[axis] = {range: bodeRange, autorange: false};
  }
  const xaxis = {
    type: "log" as const,
    range: bodeRange,
    autorange: false,
    title: { text: "Frecuencia ω (rad/s)" },
    tickmode: "array" as const,
    tickvals: Array.from({length: 25}, (_, i) => 10 ** (i - 12)),
    ticktext: Array.from({length: 25}, (_, i) => (10 ** (i - 12)).toLocaleString("es-AR", {maximumFractionDigits: 12, useGrouping: false})),
    minor: { showgrid: true, gridcolor: "#1b2a3c", ticks: "inside" as const },
    gridcolor: "#26374d",
    zerolinecolor: "#49617e",
  };
  const xy = {
    xaxis: {
      title: { text: "Parte real (s⁻¹)" },
      gridcolor: "#26374d",
      zerolinecolor: "#69809c",
    },
    yaxis: {
      title: { text: "Parte imaginaria (s⁻¹)" },
      gridcolor: "#26374d",
      zerolinecolor: "#69809c",
      scaleanchor: "x" as const,
    },
  };
  const factorLines=p.factorLines??false;
  const factorMarks=p.factorMarks??false;
  const decomposition=b?.decomposition;
  const bodeData: Data[] = b
    ? [
        curve(b.omega, b.magnitude, "Magnitud exacta", colors[0]),
        curve(b.omega, b.phase, "Fase exacta", colors[1], {
          xaxis: "x2",
          yaxis: "y2",
        }),
        ...factorTraces(b,decomposition,factorLines,factorMarks),
        ...(p.asymptotic
          ? [
              curve(
                b.omega,
                b.asymMagnitude,
                "Magnitud asintótica",
                colors[2],
                { line: { color: colors[2], dash: "dash", width: 1.6 } },
              ),
              curve(b.omega, b.asymPhase, "Fase asintótica", colors[4], {
                xaxis: "x2",
                yaxis: "y2",
                line: { color: colors[4], dash: "dash", width: 1.6 },
              }),
            ]
          : []),
      ]
    : [];
  const bodeLayout: Partial<Layout> = {
    height: 820,
    grid: { rows: 2, columns: 1, pattern: "independent" },
    xaxis: { ...xaxis, anchor: "y", matches: "x2" },
    xaxis2: { ...xaxis, anchor: "y2" },
    yaxis: {
      domain: [0.57, 1],
      title: { text: "Magnitud (dB)" },
      tickmode: "linear", tick0: 0, dtick: 20,
      gridcolor: "#26374d",
      zerolinecolor: "#68809e",
    },
    yaxis2: {
      domain: [0, 0.42],
      title: { text: "Fase (°)" },
      tickmode: "linear", tick0: 0, dtick: 90, ticksuffix: "°",
      gridcolor: "#26374d",
      zerolinecolor: "#68809e",
    },
    legend: { orientation: "h", y: 1.23, groupclick:"togglegroup" },
    margin:{l:65,r:25,t:130,b:55},
    annotations:factorAnnotations(decomposition,factorMarks),
    shapes: [
      {
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 0,
        yref: "y",
        line: { color: "#667a96", dash: "dot" },
      },
      {
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        y0: -180,
        y1: -180,
        yref: "y2",
        line: { color: "#a46d82", dash: "dot" },
      },
      ...(cursor
        ? [
            {
              type: "line",
              xref: "x",
              x0: cursor,
              x1: cursor,
              y0: 0,
              y1: 1,
              yref: "paper",
              line: { color: "#b7cce2", dash: "dot" },
            } as const,
          ]
        : []),
      ...(factorMarks ? Array.from(new Set(decomposition?.factors.filter(f=>f.frequency>0).map(f=>f.frequency) || [])) : b?.breaks || []).map((w) => ({
        type: "line" as const,
        xref: "x" as const,
        x0: w,
        x1: w,
        y0: 0,
        y1: 1,
        yref: "paper" as const,
        line: { color: "#345063", dash: "dot" as const },
      })),
      ...(b?.margins.all || []).map((cross) => ({
        type: "line" as const,
        xref: "x" as const,
        x0: cross.omega,
        x1: cross.omega,
        y0: 0,
        y1: 1,
        yref: "paper" as const,
        line: {
          color: cross.kind === "gain" ? "#f5be70" : "#55d6b0",
          dash: "dash" as const,
          width: 1,
        },
      })),
    ],
  };
  const marginal = (
    v: number | null | undefined,
    state: string | undefined,
    unit: string,
  ) =>
    v != null
      ? fmt(v) + " " + unit
      : state === "infinite"
        ? "∞"
        : state === "undefined"
          ? "No definido"
          : "Sin cruce";
  const snapshot = () => setUndo((s) => [...s.slice(-19), structuredClone(p)]);
  function example(kind: string) {
    snapshot();
    setDragEnabled(false);
    setP({
      ...structuredClone(initial),
      ...(kind === "step"
        ? { g: "1/((s+1)*(s+2))", view: "temporal" }
        : kind === "feedback"
          ? { g: "1/(s^2+s+0.5)", h: "(s+1)*(s+2)/((s+3)*(s+5))" }
          : kind === "param"
            ? {
                g: "wn^2/(s^2+2*zeta*wn*s+wn^2)",
                parameters: [
                  { name: "wn", value: 2, min: 0.1, max: 10, step: 0.1 },
                  { name: "zeta", value: 0.4, min: 0.05, max: 2, step: 0.05 },
                ],
              }
            : {}),
    });
  }
  useEffect(() => {
    if (p.view !== "plano" && !dragEnabled)
      resetModel.current = structuredClone(p);
  }, [p.view]);
  async function save() {
    try {
      validateProject(p);
      await api("validate-project", p);
      const blob = new Blob([JSON.stringify(p, null, 2)], {
        type: "application/json",
      });
      download(blob, "controllab.proyecto.json");
      savedProject.current = structuredClone(p);
      setNotice("Proyecto guardado.");
    } catch (e) {
      setNotice("No se pudo guardar: " + String(e));
    }
  }
  function download(blob: Blob, name: string) {
    const a = document.createElement("a"),
      url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function open(f: File) {
    try {
      const value: unknown = JSON.parse(await f.text());
      validateProject(value);
      await api("validate-project", value);
      snapshot();
      savedProject.current = structuredClone(value);
      resetModel.current = structuredClone(value);
      setEq(null);
      setP(value);
      setDragEnabled(false);
      setNotice("Proyecto abierto y validado.");
    } catch (e) {
      setNotice(
        "No se pudo abrir: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  }
  const editKey = p.mode === "direct" ? "l" : p.target === "h" ? "h" : "g";
  async function moveRoot(re: number, im: number) {
    if (!selected) return;
    try {
      const d = await api("edit-roots", {
        expression: p[editKey],
        kind: selected.kind,
        index: selected.index,
        re,
        im,
        parameters: parameterValues,
      });
      snapshot();
      update({ [editKey]: d.result.expression });
      setNotice("Modelo actualizado. Los conjugados se mantienen vinculados.");
    } catch (e) {
      setNotice(String(e));
    }
  }
  function convert() {
    if (!result) return;
    const m = editKey === "l" ? result.models.l0 : result.models[editKey];
    if (!m) return;
    snapshot();
    update({ [editKey]: m.expression });
    setDragEnabled(true);
    setNotice(
      "Función convertida a coeficientes. Deshacer recupera la expresión parametrizada.",
    );
  }
  async function calculateAlgebra() {
    try {
      const d = await api("algebra", {
        operation,
        functions,
        parameters: parameterValues,
      });
      setEq(d.result);
      setP((old) => ({
        ...old,
        history: [
          ...old.history,
          `${operation}: ${functions.join(" ; ")} → ${d.result.expression}`,
        ],
      }));
      setAlgebraError("");
    } catch (e) {
      setAlgebraError(String(e));
      setEq(null);
    }
  }
  async function solveBlockDiagram(diagram: Diagram) {
    return api("block-diagram/solve", diagram);
  }
  function useBlockEquivalent(expression: string) {
    snapshot();
    update({ mode:"separate",g:expression,h:"1",k:1,target:"g",temporalTarget:"g",view:"bode" });
    setNotice("Equivalente seleccionado como G₀ para el análisis.");
  }
  const idx = b && cursor !== null ? b.omega.indexOf(cursor) : -1;
  const poleShapes =
    dragEnabled && model
      ? [
          ...model.poles.map((r, i) => ({ r, i, kind: "pole" })),
          ...model.zeros.map((r, i) => ({ r, i, kind: "zero" })),
        ].map(({ r }) => ({
          type: "circle" as const,
          fillcolor: "rgba(245,190,112,0.2)",
          x0: r.re - 0.07,
          x1: r.re + 0.07,
          y0: r.im - 0.07,
          y1: r.im + 0.07,
          line: { color: "#f5be70", width: 1 },
          editable: true,
        }))
      : [];
  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            update({ view: "bode" });
          }}
        >
          <span className="brandmark">∿</span>
          <span>
            CONTROL<span className="accent">LAB</span>
            <small>Laboratorio de sistemas</small>
          </span>
        </a>
        <div className="sectionlabel">ESPACIO DE TRABAJO</div>
        <nav>
          {views.map(([id, icon, label], i) => (
            <button
              className={"navitem " + (p.view === id ? "active" : "")}
              key={id}
              onClick={() => {
                if (id === "plano" && p.view !== "plano")
                  resetModel.current = structuredClone(p);
                update({ view: id });
              }}
            >
              <span className="navicon">{icon}</span>
              <span>{label}</span>
              <small>0{i + 1}</small>
            </button>
          ))}
        </nav>
        <div className="sectionlabel exampleslabel">EXPLORAR MODELOS</div>
        <button className="example" onClick={() => example("lgr")}>
          <i />
          Ganancia crítica<small>Tres polos · K crítico = 12</small>
        </button>
        <button className="example" onClick={() => example("feedback")}>
          <i />
          Ejemplo 3 · G y H<small>Realimentación no unitaria</small>
        </button>
        <button className="example" onClick={() => example("step")}>
          <i />
          Respuesta al escalón<small>Ejercicio del resumen</small>
        </button>
        <button className="example" onClick={() => example("param")}>
          <i />
          Segundo orden<small>Explorá ωn y ζ</small>
        </button>
        <div className="local">
          <span className="led" /> Motor Python local
          <small>Sin servicios externos</small>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div className="breadcrumb">
            Laboratorio <span>/</span>{" "}
            <b>{views.find((v) => v[0] === p.view)?.[2]}</b>
          </div>
          <div className="actions">
            <button
              onClick={() => {
                snapshot();
                setP(structuredClone(initial));
              }}
            >
              Nuevo
            </button>
            <button onClick={() => file.current?.click()}>Abrir</button>
            <button onClick={save}>Guardar proyecto</button>
            <button
              disabled={!savedProject.current}
              onClick={() => {
                if (savedProject.current) {
                  snapshot();
                  setP(structuredClone(savedProject.current));
                  setDragEnabled(false);
                  setEq(null);
                  setNotice("Último proyecto guardado restaurado.");
                }
              }}
            >
              Restaurar guardado
            </button>
            <button
              className="primary"
              onClick={() =>
                exportChart(
                  p.view === "bode" ? "bode-chart" : p.view + "-chart",
                  "png",
                ).catch((e) => setNotice(String(e)))
              }
            >
              ↓ PNG
            </button>
            <button
              onClick={() =>
                exportChart(
                  p.view === "bode" ? "bode-chart" : p.view + "-chart",
                  "svg",
                ).catch((e) => setNotice(String(e)))
              }
            >
              SVG
            </button>
            <input
              hidden
              type="file"
              ref={file}
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void open(f);
                e.target.value = "";
              }}
            />
          </div>
        </header>
        <main>
          <div className="intro">
            <div>
              <div className="eyebrow">
                ANÁLISIS INTERACTIVO · TIEMPO CONTINUO
              </div>
              <h1>{views.find((v) => v[0] === p.view)?.[2]}</h1>
              <p>Modificá el modelo. Observá cómo cambia el sistema.</p>
            </div>
            <span className={"live " + (busy ? "pending" : "")}>
              <i />
              {busy
                ? "Calculando…"
                : result
                  ? "Modelo actualizado"
                  : "Conectando motor"}
              {result && <small>motor {Math.round(elapsed)} ms</small>}
            </span>
          </div>
          {error && (
            <div role="alert" className="error">
              <b>Revisá el modelo:</b> {error}
              <small>Se conserva el último resultado válido.</small>
            </div>
          )}
          {p.mode === "direct" && (
            <div className="warning">
              GH determina el lazo, pero no la salida C/R original.{" "}
              <button
                onClick={() => {
                  snapshot();
                  update({ mode: "separate", g: p.l, h: "1" });
                  setNotice("Modelo equivalente creado: G=L₀ y H=1.");
                }}
              >
                Crear equivalente con H=1
              </button>
            </div>
          )}
          <div className="analysisgrid">
            <div className="editorcolumn">
              <Panel title="Modelo del sistema" eyebrow="01 / ENTRADA">
                <div className="segmented">
                  <button
                    className={p.mode === "separate" ? "chosen" : ""}
                    onClick={() => update({ mode: "separate" })}
                  >
                    G y H separados
                  </button>
                  <button
                    className={p.mode === "direct" ? "chosen" : ""}
                    onClick={() => {
                      if (p.mode === "separate" && result)
                        update({
                          mode: "direct",
                          l: "(" + p.g + ")*(" + p.h + ")",
                          target: "l",
                        });
                      else update({ mode: "direct", target: "l" });
                    }}
                  >
                    GH directo
                  </button>
                </div>
                <FormulaEditor project={p} busy={busy} onSubmit={patch=>{snapshot();update(patch);}} />
                <div className="help">
                  Expresiones: (s+1)(s+2), s², s^2. Coeficientes: [1, 3, 2]. K
                  se aplica desde su control.
                </div>
                <div className="divider" />
                <label className="gainlabel">
                  Ganancia de exploración <b>K</b>
                </label>
                <div className="gain">
                  <input
                    aria-label="Ganancia K"
                    type="range"
                    min="0"
                    max={Math.max(30, p.k)}
                    step="0.1"
                    value={p.k}
                    onChange={(e) => update({ k: Number(e.target.value) })}
                  />
                  <input
                    data-testid="gain-number"
                    aria-label="Valor de K"
                    type="number"
                    min="0"
                    step="0.1"
                    value={p.k}
                    onChange={(e) => {
                      const k = Number(e.target.value);
                      if (Number.isFinite(k) && k >= 0) update({ k });
                    }}
                  />
                </div>
                <div className="rangeends">
                  <span>0</span>
                  <span>{Math.max(30, p.k)}</span>
                </div>
                <label className="field">
                  Representación
                  <select
                    value={p.target}
                    onChange={(e) =>
                      update({ target: e.target.value as Project["target"] })
                    }
                  >
                    <option value="l">L_K(s) = K·G₀(s)H(s)</option>
                    {p.mode === "separate" && (
                      <>
                        <option value="g">G₀(s) · modelo base</option>
                        <option value="h">H(s)</option>
                        <option value="t">T_K(s) = C(s)/R(s)</option>
                      </>
                    )}
                  </select>
                </label>
                <TransferFormula
                  model={model}
                  label={
                    p.target === "g"
                      ? "G_0(s)"
                      : p.target === "h"
                        ? "H(s)"
                        : p.target === "t"
                          ? "T_K(s)"
                          : p.mode === "direct" && p.view === "plano"
                            ? "L_0(s)"
                            : "L_K(s)"
                  }
                />
                <p className="help">
                  Realimentación negativa · K aplicada una sola vez
                </p>
              </Panel>
              <Panel title="Parámetros" eyebrow="CONTROLES DEL MODELO">
                {p.parameters.map((a, i) => (
                  <div className="parameter" key={i}>
                    <div>
                      <input
                        aria-label="Nombre de parámetro"
                        value={a.name}
                        onChange={(e) =>
                          update({
                            parameters: p.parameters.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      <button
                        aria-label={"Quitar " + a.name}
                        onClick={() =>
                          update({
                            parameters: p.parameters.filter((_, j) => j !== i),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                    <input
                      aria-label={"Control " + a.name}
                      type="range"
                      min={a.min}
                      max={a.max}
                      step={a.step}
                      value={a.value}
                      onChange={(e) =>
                        update({
                          parameters: p.parameters.map((x, j) =>
                            j === i
                              ? { ...x, value: Number(e.target.value) }
                              : x,
                          ),
                        })
                      }
                    />
                    <div className="parameterbounds">
                      {(["value", "min", "max", "step"] as const).map((key) => (
                        <label key={key}>
                          {
                            {
                              value: "Valor",
                              min: "Mín.",
                              max: "Máx.",
                              step: "Paso",
                            }[key]
                          }
                          <input
                            type="number"
                            step="any"
                            value={a[key]}
                            onChange={(e) =>
                              update({
                                parameters: p.parameters.map((x, j) =>
                                  j === i
                                    ? { ...x, [key]: Number(e.target.value) }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  className="fullbutton"
                  onClick={() =>
                    update({
                      parameters: [
                        ...p.parameters,
                        {
                          name: "a" + (p.parameters.length + 1),
                          value: 1,
                          min: 0.1,
                          max: 10,
                          step: 0.1,
                        },
                      ],
                    })
                  }
                >
                  ＋ Agregar parámetro
                </button>
              </Panel>
            </div>
            <div className="visualcolumn">
              {p.view === "bode" && (
                <Panel
                  title="Respuesta en frecuencia"
                  eyebrow="02 / MAGNITUD Y FASE"
                >
                  <BodeWorkspace decomposition={decomposition} lines={factorLines} marks={factorMarks} onLines={v=>update({factorLines:v})} onMarks={v=>update({factorMarks:v})} render={transform=>{const chart=transform(bodeData,bodeLayout);return <>
                  <div className="charttools">
                    <label>
                      <input
                        type="checkbox"
                        checked={p.asymptotic}
                        onChange={(e) =>
                          update({ asymptotic: e.target.checked })
                        }
                      />{" "}
                      Aproximaciones asintóticas
                    </label>
                    <span>Curvas exactas · motor Python</span>
                  </div>

                  <Chart
                    revision={result?.revision}
                    id="bode-chart"
                    viewState={bodeView}
                    onViewChange={(view) => chartChange("bode-chart", view)}
                    data={chart.data}
                    layout={chart.layout}
                    onHover={setCursor}
                  />
                  <div className="chartfooter">
                    Cursor sincronizado{" "}
                    {cursor && (
                      <span>
                        ω {fmt(cursor)} rad/s · {fmt(b?.magnitude[idx])} dB ·{" "}
                        {fmt(b?.phase[idx])}°
                      </span>
                    )}
                  </div>
                  </>;}} />
                </Panel>
              )}
              {p.view === "bode" && <BodeSummary data={decomposition} colors={factorColors}/> }
              {p.view === "lgr" && (
                <Panel
                  title="Trayectorias de los polos"
                  eyebrow="02 / 1 + K·L₀(s) = 0"
                >
                  {l?.error && <div className="warning">{l.error}</div>}
                  <Chart
                    revision={result?.revision}
                    id="lgr-chart"
                    viewState={p.charts?.["lgr-chart"]}
                    onViewChange={(view) => chartChange("lgr-chart", view)}
                    data={
                      l
                        ? [
                            ...l.asymptotes.map((a) =>
                              curve(a.x, a.y, "Asíntota", "#5d6d89", {
                                showlegend: false,
                                line: {
                                  color: "#5d6d89",
                                  dash: "dash",
                                  width: 1,
                                },
                              }),
                            ),
                            ...l.segments.map((a) =>
                              curve(
                                [a.min, a.max],
                                [0, 0],
                                "Segmento real",
                                "#7182a5",
                                {
                                  showlegend: false,
                                  line: { color: "#7182a5", width: 4 },
                                },
                              ),
                            ),
                            ...l.branches.map((a, i) =>
                              curve(
                                a.x,
                                a.y,
                                "Rama " + (i + 1),
                                colors[i % colors.length],
                              ),
                            ),
                            points(l.openPoles, "Polos de L₀", "x", "#f58399"),
                            points(
                              l.zeros,
                              "Ceros de L₀",
                              "circle-open",
                              "#55d6b0",
                            ),
                            points(
                              l.closedPoles,
                              "Polos para K=" + fmt(p.k),
                              "circle",
                              "#f5be70",
                            ),
                          ]
                        : []
                    }
                    layout={{
                      ...xy,
                      xaxis: { ...xy.xaxis, range: l?.range.x },
                      yaxis: { ...xy.yaxis, range: l?.range.y },
                      height: 640,
                      legend: { orientation: "h", y: 1.13 },
                    }}
                  />
                  <div className="chartfooter">
                    K = {fmt(p.k)} · Modificá K para desplazar los polos
                    cerrados.
                  </div>
                </Panel>
              )}
              {p.view === "plano" && (
                <Panel
                  title="Plano complejo"
                  eyebrow="02 / INSPECCIÓN Y EDICIÓN"
                >
                  <div className="charttools">
                    <button
                      disabled={
                        p.target === "t" ||
                        (p.target === "l" && p.mode === "separate")
                      }
                      onClick={convert}
                    >
                      Convertir a coeficientes para arrastrar
                    </button>
                    <button
                      disabled={!undo.length}
                      onClick={() => {
                        setP(undo[undo.length - 1]);
                        setUndo((s) => s.slice(0, -1));
                        setDragEnabled(false);
                      }}
                    >
                      Deshacer
                    </button>
                    <button
                      onClick={() => {
                        snapshot();
                        setP({
                          ...structuredClone(resetModel.current),
                          view: "plano",
                        });
                        setDragEnabled(false);
                      }}
                    >
                      Restablecer
                    </button>
                  </div>
                  <Chart
                    revision={result?.revision}
                    id="plano-chart"
                    viewState={p.charts?.["plano-chart"]}
                    onViewChange={(view) => chartChange("plano-chart", view)}
                    data={
                      model
                        ? [
                            points(model.poles, "Polos", "x", "#f58399"),
                            points(
                              model.zeros,
                              "Ceros",
                              "circle-open",
                              "#55d6b0",
                            ),
                          ]
                        : []
                    }
                    layout={{ ...xy, height: 550, shapes: poleShapes }}
                    onClick={(point) => {
                      if (
                        !model ||
                        p.target === "t" ||
                        (p.target === "l" && p.mode === "separate")
                      )
                        return;
                      const kind = point.curveNumber === 0 ? "pole" : "zero",
                        r = (kind === "pole" ? model.poles : model.zeros)[
                          point.pointNumber
                        ];
                      setSelected({ kind, index: point.pointNumber, ...r });
                      setRootEdit(r);
                    }}
                    onRelayout={(v) => {
                      if (!dragEnabled || !model) return;
                      for (const key of Object.keys(v)) {
                        const match = key.match(/^shapes\[(\d+)\]\.x0$/);
                        if (!match) continue;
                        const i = Number(match[1]),
                          kind = i < model.poles.length ? "pole" : "zero",
                          index = kind === "pole" ? i : i - model.poles.length,
                          r = (kind === "pole" ? model.poles : model.zeros)[
                            index
                          ];
                        const x = Number(v[key]) + 0.07,
                          y =
                            r.im === 0
                              ? 0
                              : Number(v[`shapes[${i}].y0`] ?? r.im - 0.07) +
                                0.07;
                        setSelected({ kind, index, ...r });
                        void api("edit-roots", {
                          expression: p[editKey],
                          kind,
                          index,
                          re: x,
                          im: y,
                          parameters: parameterValues,
                        })
                          .then((d) => {
                            snapshot();
                            update({ [editKey]: d.result.expression });
                          })
                          .catch((e) => setNotice(String(e)));
                        break;
                      }
                    }}
                  />
                  <div className="chartfooter">
                    {dragEnabled
                      ? "Arrastrá los círculos ámbar. Polos reales restringidos al eje real."
                      : "Seleccioná un polo o cero. Para arrastrar, convertí explícitamente el modelo a coeficientes."}
                  </div>
                  {selected && (
                    <div className="rootform">
                      <b>
                        {selected.kind === "pole" ? "Polo" : "Cero"}{" "}
                        seleccionado
                      </b>
                      <label>
                        Real
                        <input
                          type="number"
                          step="0.1"
                          value={rootEdit.re}
                          onChange={(e) =>
                            setRootEdit({
                              ...rootEdit,
                              re: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Imaginaria
                        <input
                          disabled={selected.im === 0}
                          type="number"
                          step="0.1"
                          value={rootEdit.im}
                          onChange={(e) =>
                            setRootEdit({
                              ...rootEdit,
                              im: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <button
                        disabled={!dragEnabled}
                        onClick={() =>
                          moveRoot(
                            rootEdit.re,
                            selected.im === 0 ? 0 : rootEdit.im,
                          )
                        }
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </Panel>
              )}
              {p.view === "temporal" && (
                <Panel
                  title="Entrada y salida"
                  eyebrow="02 / RESPUESTA TEMPORAL"
                >
                  <div className="charttools">
                    <select
                      aria-label="Señal de entrada"
                      value={p.temporal.signal}
                      onChange={(e) =>
                        update({
                          temporal: { ...p.temporal, signal: e.target.value },
                        })
                      }
                    >
                      <option value="step">Escalón</option>
                      <option value="ramp">Rampa</option>
                      <option value="impulse">Impulso</option>
                    </select>
                    <label>
                      Duración (s)
                      <input
                        type="number"
                        min="0.1"
                        step="1"
                        value={p.temporal.duration}
                        onChange={(e) =>
                          update({
                            temporal: {
                              ...p.temporal,
                              duration: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Amplitud
                      <input
                        type="number"
                        step="0.1"
                        value={p.temporal.amplitude}
                        onChange={(e) =>
                          update({
                            temporal: {
                              ...p.temporal,
                              amplitude: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                  {result?.models.t && (
                    <TransferFormula model={result.models.t} label="T_K(s)" />
                  )}
                  {t?.error ? (
                    <div className="empty">{t.error}</div>
                  ) : (
                    <Chart
                      revision={result?.revision}
                      id="temporal-chart"
                      viewState={p.charts?.["temporal-chart"]}
                      onViewChange={(view) =>
                        chartChange("temporal-chart", view)
                      }
                      data={
                        t?.time
                          ? [
                              curve(
                                t.time,
                                t.input || [],
                                "Entrada",
                                "#6b829e",
                                { line: { color: "#6b829e", dash: "dash" } },
                              ),
                              curve(
                                t.time,
                                t.output || [],
                                "Salida C(t)",
                                colors[0],
                              ),
                            ]
                          : []
                      }
                      layout={{
                        height: 550,
                        xaxis: {
                          title: { text: "Tiempo (s)" },
                          gridcolor: "#26374d",
                        },
                        yaxis: {
                          title: { text: "Amplitud" },
                          gridcolor: "#26374d",
                        },
                        legend: { orientation: "h", y: 1.1 },
                      }}
                    />
                  )}{" "}
                  {!!t?.impulseWeight && (
                    <div className="warning">
                      Componente instantánea: {fmt(t.impulseWeight)}·δ(t). La
                      curva muestra la parte regular.
                    </div>
                  )}
                  <div className="metricsgrid">
                    {Object.entries(t?.metrics || {}).map(([key, value]) => (
                      <div key={key}>
                        <small>{key}</small>
                        <b>{fmt(value)}</b>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
              {p.view === "algebra" && (
                <>
                <BlockDiagramEditor
                  value={p.blockDiagram as Diagram | undefined}
                  onChange={(blockDiagram) => update({ blockDiagram })}
                  onSolve={solveBlockDiagram}
                  onAnalyze={useBlockEquivalent}
                />
                <Panel
                  title="Combinar funciones"
                  eyebrow="02 / ÁLGEBRA DE BLOQUES"
                >
                  <div className="algebrabody">
                    {functions.map((f, i) => (
                      <label className="field" key={i}>
                        Función {i + 1}
                        {operation === "feedback"
                          ? i === 0
                            ? " · G(s)"
                            : " · H(s)"
                          : ""}
                        <textarea
                          value={f}
                          onChange={(e) =>
                            setFunctions(
                              functions.map((x, j) =>
                                j === i ? e.target.value : x,
                              ),
                            )
                          }
                        />
                      </label>
                    ))}
                    <button
                      onClick={() => setFunctions([...functions, "1/(s+1)"])}
                    >
                      ＋ Agregar función
                    </button>
                    <label className="field">
                      Operación
                      <select
                        value={operation}
                        onChange={(e) => setOperation(e.target.value)}
                      >
                        <option value="series">Serie · producto</option>
                        <option value="parallel">Paralelo · suma</option>
                        <option value="subtract">Resta</option>
                        <option value="feedback">
                          Realimentación negativa · G/(1+GH)
                        </option>
                      </select>
                    </label>
                    <button className="primary" onClick={calculateAlgebra}>
                      Calcular equivalente
                    </button>
                    {algebraError && (
                      <div className="error">{algebraError}</div>
                    )}
                    {eq && (
                      <>
                        <div className="equivalent">
                          <small>FUNCIÓN EQUIVALENTE</small>
                          <TransferFormula model={eq} label="G_{eq}(s)" />
                        </div>
                        <button
                          onClick={() => {
                            snapshot();
                            update({
                              mode: "separate",
                              g: eq.expression,
                              h: "1",
                              k: 1,
                              target: "l",
                              view: "bode",
                              history: [
                                ...p.history,
                                `${operation}: ${functions.join(" ; ")} → ${eq.expression}`,
                              ],
                            });
                            setNotice(
                              "Equivalente enviada como G₀, con H=1 y K=1.",
                            );
                          }}
                        >
                          Usar como G₀ en el analizador →
                        </button>
                      </>
                    )}
                    <h3>Historial del proyecto</h3>
                    {p.history.length ? (
                      p.history.map((x, i) => (
                        <div className="history" key={i}>
                          {x}
                        </div>
                      ))
                    ) : (
                      <p className="help">
                        Las equivalentes enviadas al analizador se guardan acá.
                      </p>
                    )}
                  </div>
                </Panel>
                </>
              )}
            </div>
            <div className="resultscolumn">
              <Panel title="Estado del sistema" eyebrow="03 / RESULTADOS">
                <div className={"stability " + (result?.stability || "")}>
                  <i />
                  {{
                    stable: "Estable",
                    marginal: "En el límite",
                    unstable: "Inestable",
                    undefined: "No definida",
                  }[result?.stability || ""] || "Sin resultado"}
                  <small>Polos de la ecuación característica</small>
                </div>
                <div className="metric">
                  <span>
                    Transferencia seleccionada ·{" "}
                    {p.target === "l" &&
                    p.mode === "direct" &&
                    p.view === "plano"
                      ? "L₀"
                      : p.target === "l"
                        ? "L_K"
                        : p.target === "t"
                          ? "T_K"
                          : p.target === "g"
                            ? "G₀"
                            : "H"}
                  </span>
                  <b>
                    {
                      {
                        stable: "Estable",
                        marginal: "En el límite",
                        unstable: "Inestable",
                        undefined: "No definida",
                      }[
                        (p.mode === "direct" && p.view === "plano"
                          ? result?.baseStability
                          : result?.selectedStability) || "undefined"
                      ]
                    }
                  </b>
                </div>
                {p.view === "bode" ? (
                  <>
                    <div className="metric">
                      <span>Margen de ganancia</span>
                      <b>{marginal(b?.margins.gm, b?.margins.gmState, "dB")}</b>
                    </div>
                    <div className="metric">
                      <span>Margen de fase</span>
                      <b>{marginal(b?.margins.pm, b?.margins.pmState, "°")}</b>
                    </div>
                    <div className="metric">
                      <span>Cruce de ganancia · ωgc</span>
                      <b>{fmt(b?.margins.wgc)} rad/s</b>
                    </div>
                    <div className="metric">
                      <span>Cruce de fase · ωpc</span>
                      <b>{fmt(b?.margins.wpc)} rad/s</b>
                    </div>
                    <p className="help">
                      Márgenes de L_K(s), independientes del zoom y de la
                      representación seleccionada.
                    </p>
                    {!p.frequency.auto &&
                      b?.margins.all.some(
                        (cross) =>
                          cross.omega < p.frequency.min ||
                          cross.omega > p.frequency.max,
                      ) && (
                        <div className="insight">
                          Hay cruces fuera del rango visible. Usá «Ajustar rango
                          a quiebres y cruces» para incluirlos.
                        </div>
                      )}
                    {(b?.margins.all || []).length > 1 && (
                      <details>
                        <summary>Todos los cruces</summary>
                        {b?.margins.all.map((m, i) => (
                          <div className="metric" key={i}>
                            <span>
                              {m.kind === "gain" ? "Ganancia" : "Fase"} ·{" "}
                              {fmt(m.omega)} rad/s
                            </span>
                            <b>{fmt(m.margin)}</b>
                          </div>
                        ))}
                      </details>
                    )}
                    <div className="divider" />
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={p.frequency.auto}
                        onChange={(e) =>
                          update({
                            frequency: {
                              ...p.frequency,
                              auto: e.target.checked,
                            },
                          })
                        }
                      />{" "}
                      Rango automático
                    </label>
                    <div className="freqinputs">
                      <label>
                        ω mínima
                        <input
                          aria-label="Frecuencia mínima"
                          type="number"
                          min="0.000001"
                          step="any"
                          disabled={p.frequency.auto}
                          value={p.frequency.min}
                          onChange={(e) =>
                            update({
                              frequency: {
                                ...p.frequency,
                                min: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        ω máxima
                        <input
                          aria-label="Frecuencia máxima"
                          type="number"
                          step="any"
                          disabled={p.frequency.auto}
                          value={p.frequency.max}
                          onChange={(e) =>
                            update({
                              frequency: {
                                ...p.frequency,
                                max: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                    <button
                      className="fullbutton"
                      onClick={() =>
                        update({
                          frequency: { ...p.frequency, auto: true },
                          charts: {
                            ...p.charts,
                            "bode-chart": {
                              xaxis: { autorange: true },
                              xaxis2: { autorange: true },
                              yaxis: { autorange: true },
                              yaxis2: { autorange: true },
                            },
                          },
                        })
                      }
                    >
                      Ajustar rango a quiebres y cruces
                    </button>
                    <button className="fullbutton" onClick={() => update({
                      frequency: {...p.frequency, auto: false, min: 0.001, max: 10000},
                      charts: {...p.charts, "bode-chart": {
                        xaxis: {range: [-3, 4], autorange: false},
                        xaxis2: {range: [-3, 4], autorange: false},
                        yaxis: {autorange: true}, yaxis2: {autorange: true},
                      }},
                    })}>Vista para hoja · décadas y 90°</button>
                    <p className="hint">Frecuencia por décadas (rad/s), magnitud cada 20 dB y fase cada 90°. Podés ampliar cualquier zona con zoom.</p>
                    <div className="metric">
                      <span>Frecuencias de quiebre</span>
                      <b>
                        {b?.breaks.map((x) => fmt(x)).join(" · ") || "Ninguna"}
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="metric">
                      <span>Centroide</span>
                      <b>{fmt(l?.centroid)}</b>
                    </div>
                    <div className="metric">
                      <span>Ángulos de asíntotas</span>
                      <b>
                        {l?.angles.map((x) => fmt(x) + "°").join(", ") ||
                          "Ninguna"}
                      </b>
                    </div>
                    <div className="metric">
                      <span>Cruces imaginarios</span>
                      <b>
                        {l?.crossings
                          .map((x) => "K=" + fmt(x.k) + " · ±j" + fmt(x.omega))
                          .join("; ") || "Ninguno"}
                      </b>
                    </div>
                    <div className="metric">
                      <span>Rupturas válidas</span>
                      <b>
                        {l?.breakaways
                          .map((x) =>
                            typeof x === "number" ? fmt(x) : rootText(x),
                          )
                          .join(", ") || "Ninguna"}
                      </b>
                    </div>
                  </>
                )}
                <div className="divider" />
                <div className="rootlist">
                  <small>POLOS PARA K = {fmt(p.k)}</small>
                  {l?.closedPoles.map((r, i) => (
                    <div key={i}>
                      <span>×</span>
                      {rootText(r)}
                    </div>
                  ))}
                </div>
                {(result?.warnings || []).map((w, i) => (
                  <div className="insight" key={i}>
                    {w}
                  </div>
                ))}
              </Panel>
            </div>
          </div>
          <footer>
            <span>
              CONTROL<span className="accent">LAB</span> <i>·</i> Laboratorio
              interactivo de sistemas de control
            </span>
            <span>Local · LTI · SISO · Realimentación negativa</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
