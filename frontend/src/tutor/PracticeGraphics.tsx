import { DraftFormula } from "./TutorMath";
import { useEffect, useId, useState, type MouseEvent } from "react";
import type { Analysis } from "../types";
import type { Diagram, Node } from "./blocks";
import type { LocusExercise, RouthLesson } from "./locus";

function graphPoint(event: MouseEvent<SVGSVGElement>) {
  const matrix = event.currentTarget.getScreenCTM();
  if (!matrix) return;
  return new DOMPoint(event.clientX, event.clientY).matrixTransform(
    matrix.inverse(),
  );
}

export function LocusGraph({
  exercise,
  progress,
  onPick,
  picked,
}: {
  exercise: LocusExercise;
  progress: number;
  onPick?: (real: number) => void;
  picked?: number;
}) {
  const clip = useId();
  const layers = exercise.layers.filter((layer) => layer.stage < progress);
  const showBranches = layers.some((layer) => layer.kind === "branches");
  const [result, setResult] = useState<{
    id: string;
    data?: Analysis["locus"];
    error?: string;
  }>();
  useEffect(() => {
    if (!showBranches || result?.id === exercise.id) return;
    const controller = new AbortController();
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "direct", l: exercise.l0, k: 1 }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error("No se pudo calcular el lugar.");
        const data: Analysis = await response.json();
        setResult({
          id: exercise.id,
          data: data.locus,
          error: data.locus?.error,
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ id: exercise.id, error: String(error.message) });
      });
    return () => controller.abort();
  }, [exercise, showBranches, result?.id]);

  const left = 45,
    right = 455,
    top = 18,
    bottom = 374;
  const minimum = exercise.partial ? -7 : -5;
  const maximum = exercise.partial ? 6 : 2;
  const scale = (right - left) / (maximum - minimum);
  const x = (real: number) => left + (real - minimum) * scale;
  const y = (imag: number) => (top + bottom) / 2 - imag * scale;
  function pick(event: MouseEvent<SVGSVGElement>) {
    const point = graphPoint(event);
    if (
      point &&
      point.x >= left &&
      point.x <= right &&
      Math.abs(point.y - y(0)) < 25
    ) {
      onPick?.(
        Math.round(((point.x - left) / scale + minimum) * 100) / 100,
      );
    }
  }

  return (
    <>
      <div className="tutor-visual-scroll">
      <svg
        viewBox="0 0 480 412"
        className={onPick ? "tutor-graph tutor-pick" : "tutor-graph"}
        role="img"
        aria-label="Plano complejo del lugar de las raíces"
        onClick={pick}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={left} y={top} width={right - left} height={bottom - top} />
          </clipPath>
        </defs>
        <rect
          x={left}
          y={top}
          width={right - left}
          height={bottom - top}
          fill="#16272d"
          stroke="#64777a"
        />
        <g className="tutor-ticks">
          {Array.from({ length: maximum - minimum + 1 }, (_, i) => minimum + i).map((v) => (
            <g key={v}>
              <line
                x1={x(v)}
                x2={x(v)}
                y1={top}
                y2={bottom}
                className={v === 0 ? "reference" : ""}
              />
              <text x={x(v)} y={bottom + 18} textAnchor="middle">
                {v}
              </text>
            </g>
          ))}
          {(exercise.partial ? [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] : [-3, -2, -1, 0, 1, 2, 3]).map((v) => (
            <g key={v}>
              <line
                x1={left}
                x2={right}
                y1={y(v)}
                y2={y(v)}
                className={v === 0 ? "reference" : ""}
              />
              <text
                x={left - 7}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {v}
              </text>
            </g>
          ))}
          <text x={right} y={408} textAnchor="end">
            Re(s)
          </text>
          <text x={left + 5} y={top + 15}>
            Im(s)
          </text>
        </g>
        <g clipPath={"url(#" + clip + ")"}>
          {showBranches &&
            result?.id === exercise.id &&
            result.data?.branches.map((branch, i) => (
              <polyline
                key={i}
                fill="none"
                stroke="#83abf1"
                strokeWidth="2"
                points={branch.x
                  .flatMap((re, j) =>
                    re === null || branch.y[j] === null
                      ? []
                      : [x(re) + "," + y(branch.y[j]!)],
                  )
                  .join(" ")}
              />
            ))}
          {layers.map(({ kind, values }, i) => {
            const [value, second] = values;
            const px = x(value),
              py = y(0);
            switch (kind) {
              case "pole":
                return (
                  <path
                    key={i}
                    d={`M${px - 5} ${py - 5}l10 10m0 -10l-10 10`}
                    stroke="#ff9c77"
                    strokeWidth="3"
                  />
                );
              case "zero":
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r="5"
                    stroke="#84c6ba"
                    strokeWidth="3"
                    fill="none"
                  />
                );
              case "center":
                return (
                  <path
                    key={i}
                    d={`M${px} ${py + 4}l-6 10h12z`}
                    fill="#f0cf84"
                  />
                );
              case "segment":
                return (
                  <line
                    key={i}
                    x1={x(Math.max(value, minimum))}
                    x2={x(Math.min(second, maximum))}
                    y1={py}
                    y2={py}
                    stroke="#84c6ba"
                    strokeWidth="3"
                  />
                );
              case "angles":
                return (
                  <g key={i}>
                    {values.slice(1).map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      return (
                        <line
                          key={angle}
                          x1={px}
                          x2={x(value + 9 * Math.cos(rad))}
                          y1={py}
                          y2={y(9 * Math.sin(rad))}
                          stroke="#f0cf84"
                          strokeDasharray="6 5"
                        />
                      );
                    })}
                  </g>
                );
              case "break":
                return <circle key={i} cx={px} cy={py} r="4" fill="#fff" />;
              case "crossing":
                return (
                  <g key={i} fill="#fff">
                    {[-value, value].map((v) => (
                      <circle key={v} cx={x(0)} cy={y(v)} r="4" />
                    ))}
                  </g>
                );
              default:
                return null;
            }
          })}
          {picked !== undefined && (
            <circle cx={x(picked)} cy={y(0)} r="6" stroke="white" fill="none" />
          )}
        </g>
      </svg>
      </div>
      <ul className="tutor-legend" aria-label="Elementos confirmados">
        {layers.some((l) => l.kind === "pole") && <li>× Polo</li>}
        {layers.some((l) => l.kind === "zero") && <li>○ Cero</li>}
        {layers.filter((l) => (l.kind === "pole" || l.kind === "zero") && l.values[1] > 1)
          .map(({ kind, values }) => (
            <li key={kind + values[0]}>{kind === "pole" ? "× Polo" : "○ Cero"} en {values[0]} · multiplicidad {values[1]}</li>
          ))}
        {layers.some((l) => l.kind === "center") && <li>△ Centroide</li>}
        {layers.some((l) => l.kind === "angles") && <li>┄ Asíntotas</li>}
        {layers.some((l) => l.kind === "segment") && (
          <li>━ Segmentos reales</li>
        )}
        {layers.some((l) => l.kind === "break") && <li>• Ruptura</li>}
        {layers.some((l) => l.kind === "crossing") && (
          <li>• Cruce imaginario{exercise.partial && ` en ±j${Number(layers.find((l) => l.kind === "crossing")!.values[0].toPrecision(5))}`}</li>
        )}
        {showBranches && <li>━ Ramas del lugar</li>}
      </ul>
      {showBranches && result?.id !== exercise.id && (
        <p role="status">Calculando ramas…</p>
      )}
      {showBranches && result?.id === exercise.id && result.error && (
        <p role="alert">{result.error}</p>
      )}
    </>
  );
}

export function RouthTable({
  cells,
  progress,
  currentStep,
  onSelect,
}: {
  cells: RouthLesson["cells"];
  progress: number;
  currentStep?: number;
  onSelect?: () => void;
}) {
  const order = Math.max(...cells.map((cell) => cell.row));
  const columns = Array.from({ length: Math.max(...cells.map((cell) => cell.col)) + 1 }, (_, i) => i);
  return (
    <table aria-label="Tabla de Routh">
      <thead>
        <tr>
          <th scope="col">Fila</th>
          {columns.map((col) => <th key={col} scope="col">Columna {col + 1}</th>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: order + 1 }, (_, i) => i).map((row) => (
          <tr key={row}>
            <th scope="row">
              s<sup>{order - row}</sup>
            </th>
            {columns.map((col) => {
              const cell = cells.find((c) => c.row === row && c.col === col);
              const active = cell && cell.stage === currentStep;
              return (
                <td key={col}>
                  {active ? (
                    <button
                      type="button"
                      aria-label={`Responder fila s^${order - row}, columna ${col + 1}`}
                      onClick={onSelect}
                    >
                      —
                    </button>
                  ) : cell && cell.stage < progress ? (
                    cell.label
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const coordinate = (col: number, row: number) =>
  [38 + col * 66, 36 + row * 55] as const;
type Point = readonly [number, number];
function endpoint(node: Node, next: Point): Point {
  const center = coordinate(node[1], node[2]);
  const dx = next[0] - center[0],
    dy = next[1] - center[1];
  const radius = node[0].startsWith(".")
    ? 2
    : node[0].startsWith("Σ")
      ? 14
      : node[0] === "equivalente"
        ? 60
        : 25;
  return Math.abs(dx) >= Math.abs(dy)
    ? [center[0] + Math.sign(dx) * radius, center[1]]
    : [center[0], center[1] + Math.sign(dy) * Math.min(14, radius)];
}

export function BlockGraph({
  diagram,
  selectable = [],
  onPick,
  picked,
}: {
  diagram: Diagram;
  selectable?: string[];
  onPick?: (name: string) => void;
  picked?: string;
}) {
  const arrow = useId();
  const nodes = diagram.nodes;
  const rows = [
    ...nodes.map(([, , row]) => row),
    ...diagram.edges.flatMap(([, , , via]) =>
      (via ?? []).map(([, row]) => row),
    ),
  ];
  const firstRow = Math.min(...rows);
  const lastRow = Math.max(...rows);
  const width = Math.max(...nodes.map(([, col]) => col)) * 66 + 76;
  const nodeMap = new Map(nodes.map((node) => [node[0], node]));
  const description = diagram.edges
    .map(
      ([from, to, sign]) =>
        from.replace(/^\./, "nodo ") +
        " a " +
        to +
        (sign ? " (" + sign + ")" : ""),
    )
    .join(", ");
  return (
    <div className="tutor-diagram-scroll">
      <svg
        className="tutor-graph tutor-diagram"
        style={{ minWidth: Math.min(width, 700) }}
        viewBox={`0 ${firstRow * 55} ${width} ${(lastRow - firstRow) * 55 + 72}`}
        role="group"
        aria-label={"Diagrama de bloques. " + description}
      >
        <defs>
          <marker
            id={arrow}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L8 4L0 8Z" fill="#b6ccd0" />
          </marker>
        </defs>
        {diagram.edges.map(([from, to, sign, via], i) => {
          const source = nodeMap.get(from)!,
            target = nodeMap.get(to)!;
          const points = (via ?? []).map(([col, row]) => coordinate(col, row));
          const start = endpoint(
            source,
            points[0] ?? coordinate(target[1], target[2]),
          );
          const end = endpoint(
            target,
            points.at(-1) ?? coordinate(source[1], source[2]),
          );
          const prior = points.at(-1) ?? start;
          const dx = end[0] - prior[0],
            dy = end[1] - prior[1];
          return (
            <g key={i}>
              <polyline
                points={[start, ...points, end]
                  .map((point) => point.join(","))
                  .join(" ")}
                fill="none"
                stroke="#b6ccd0"
                strokeWidth="1.5"
                markerEnd={
                  to.startsWith(".") ? undefined : "url(#" + arrow + ")"
                }
              />
              {sign && (
                <text
                  x={end[0] - (dx > 0 ? 7 : 0) + (dy !== 0 ? 9 : 0)}
                  y={end[1] - (dy > 0 ? 3 : 7) + (dy < 0 ? 16 : 0)}
                  className="tutor-sign"
                  textAnchor="middle"
                >
                  {sign}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map(([id, col, row, label]) => {
          const [cx, cy] = coordinate(col, row);
          const active = selectable.includes(id) && !!onPick;
          if (id.startsWith(".") && !label && !active)
            return <circle key={id} cx={cx} cy={cy} r="3" fill="#b6ccd0" />;
          const take = id.startsWith(".");
          const sum = id.startsWith("Σ");
          const w = id === "equivalente" ? 120 : 50;
          return (
            <g
              key={id}
              className={active ? "tutor-node tutor-pick" : "tutor-node"}
              data-picked={picked === id}
              role={active ? "button" : undefined}
              aria-label={active ? "Seleccionar " + id : undefined}
              tabIndex={active ? 0 : undefined}
              onClick={active ? () => onPick(id) : undefined}
              onKeyDown={
                active
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onPick(id);
                      }
                    }
                  : undefined
              }
            >
              {take ? (
                <>
                  {active && <circle cx={cx} cy={cy} r="22" style={{ fill: "transparent" }} />}
                  <circle cx={cx} cy={cy} r="4" style={{ fill: "#b6ccd0" }} />
                </>
              ) : sum ? (
                <circle cx={cx} cy={cy} r="14" />
              ) : (
                <rect x={cx - w / 2} y={cy - 13} width={w} height="26" rx="3" />
              )}
              <text
                x={cx}
                y={cy + (take ? -15 : 1)}
                textAnchor="middle"
                dominantBaseline="middle"
                textLength={
                  (label?.length ?? 0) > (id === "equivalente" ? 18 : 7)
                    ? w - 8
                    : undefined
                }
                lengthAdjust="spacingAndGlyphs"
              >
                {take ? label ?? id.slice(1) : label && label.length > 9 && /^Q\d+$/.test(id) ? id : label ?? id}
              </text>
            </g>
          );
        })}
      </svg>
      {nodes.filter(([id,,,label]) => /^Q\d+$/.test(id) && label && label.length > 9).map(([id,,,label]) =>
        <p key={id}>{id} = <DraftFormula value={label!}/></p>)}

    </div>
  );
}
