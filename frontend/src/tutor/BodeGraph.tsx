import RouthMath from "../RouthMath";
﻿import { useState, type MouseEvent } from "react";
import type { BodeExercise, Layer } from "./bode";

const width = 480,
  height = 270,
  left = 53,
  right = 465,
  top = 14,
  bottom = 220;

export default function BodeGraph({
  exercise,
  axis,
  progress,
  summing,
  onPick,
  picked,
}: {
  exercise: BodeExercise;
  axis: "mag" | "phase";
  progress: number;
  summing: boolean;
  onPick?: (omega: number) => void;
  picked?: number;
}) {
  const [low, high] = exercise.range.map(Math.log10);
  const [view, setView] = useState<"aportes" | "suma">(summing ? "suma" : "aportes");
  const revealed = exercise.layers[axis].filter(([stage]) => stage < progress);
  const contributions = revealed
    .map(([, layer]) => layer)
    .filter(
      (layer) =>
        layer.style === "factor" ||
        layer.style === "slope" ||
        layer.style === "pole" ||
        layer.style === "zero" ||
        layer.style === "frequency" ||
        (layer.style === "marker" && layer.label.startsWith("Factor ")),
    );
  const confirmedSum = revealed.filter(([, layer]) =>
    layer.style === "partial" || layer.style === "total").at(-1)?.[1];
  const sum = confirmedSum && { ...confirmedSum, color: "#ff394b" };
  const confirmedFrequencies = new Set(sum?.points.map(([omega]) => omega));
  const learningSum = summing && view === "suma";
  const background = learningSum
    ? contributions.filter(layer => layer.style === "factor")
    : contributions;
  const readings = revealed.map(([, layer]) => layer).filter((layer) =>
    layer.style === "exact" ||
    (layer.style === "marker" && !layer.label.startsWith("Factor ")),
  );
  const layers = [...background, ...(view === "suma" && sum ? [sum] : []), ...readings];
  const values = [
    0,
    axis === "mag" ? 20 : -180,
    ...layers.flatMap((layer) => layer.points.map(([, v]) => v)),
  ];
  const min = Math.min(...values),
    max = Math.max(...values);
  const interval =
    axis === "mag" ? Math.max(10, Math.ceil((max - min) / 70) * 10) : 45;
  const yLow = Math.floor(min / interval) * interval - interval,
    yHigh = Math.ceil(max / interval) * interval + interval;
  const x = (w: number) =>
    left + ((Math.log10(w) - low) / (high - low)) * (right - left);
  const y = (v: number) =>
    bottom - ((v - yLow) / (yHigh - yLow)) * (bottom - top);
  const yTicks = Array.from(
    { length: Math.round((yHigh - yLow) / interval) + 1 },
    (_, i) => yLow + i * interval,
  );
  const xTicks = Array.from(
    { length: Math.floor(high) - Math.ceil(low) + 1 },
    (_, i) => Math.ceil(low) + i,
  );
  function pick(event: MouseEvent<SVGSVGElement>) {
    const scale = event.currentTarget.getScreenCTM();
    if (!onPick || !scale) return;
    const { x: pointer, y: vertical } = new DOMPoint(
      event.clientX,
      event.clientY,
    ).matrixTransform(scale.inverse());
    if (
      pointer < left ||
      pointer > right ||
      vertical < top ||
      vertical > bottom
    )
      return;
    onPick(10 ** (low + ((pointer - left) / (right - left)) * (high - low)));
  }
  const name = axis === "mag" ? "Magnitud en dB" : "Fase en grados";
  function draw(layer: Layer, i: number) {
    const { points, color, style } = layer;
    if (style === "slope") {
      const [w,v] = points[0];
      const end = x(w) > right - 78;
      return <g key={i} fill={color}>
        <circle cx={x(w)} cy={y(v)} r={2.5}/>
        <text x={x(w)+(end ? -4 : 4)} y={y(v)+(v > 0 ? 12 : -6)} textAnchor={end ? "end" : "start"}
          fontSize={10} stroke="#16272d" strokeWidth={3} paintOrder="stroke">{layer.label}</text>
      </g>;
    }
    if (style === "identity") return null;
    if (style === "pole" || style === "zero") {
      const cx = x(points[0][0]),
        cy = y(points[0][1]);
      return (
        <g key={i} stroke={color} strokeWidth={2} fill="none">
          <title>
            {layer.label} · aporte a {points[0][0]} rad/s: {points[0][1]}{" "}
            {axis === "mag" ? "dB" : "°"}
          </title>
          {style === "pole" ? (
            <path d={`M${cx - 4} ${cy - 4}l8 8m0 -8l-8 8`} />
          ) : (
            <circle cx={cx} cy={cy} r={4} />
          )}
        </g>
      );
    }
    if (style === "frequency")
      return (
        <g key={i}>
          {points.map(([omega]) => (
            <path
              key={omega}
              d={`M${x(omega) - 4},${top}h8l-4,7z`}
              fill={color}
            >
              <title>
                {layer.label} · {omega} rad/s
              </title>
            </path>
          ))}
        </g>
      );
    if (style === "marker")
      return (
        <g key={i}>
          {points.map(([w, v]) => (
            <circle key={w} cx={x(w)} cy={y(v)} r={4} fill={color} />
          ))}
        </g>
      );
    return (
      <polyline
        key={i}
        fill="none"
        stroke={color}
        strokeWidth={layer === sum ? 3.8 : 1.7}
        points={points.map(([w, v]) => `${x(w)},${y(v)}`).join(" ")}
      />
    );
  }
  return (
    <>
      {sum && (
        <div className="tutor-actions" aria-label="Tipo de trazado">
          <button
            aria-keyshortcuts="Alt+3" aria-pressed={view === "aportes"}
            onClick={() => setView("aportes")}
          >
            Aportes individuales
          </button>
          <button
            aria-keyshortcuts="Alt+4" aria-pressed={view === "suma"}
            onClick={() => setView("suma")}
          >
            Suma por rectas
          </button>
        </div>
      )}
      <div className="tutor-visual-scroll">
        <svg
          className={onPick ? "tutor-graph tutor-pick" : "tutor-graph"}
          role="img"
          aria-label={name}
          viewBox={`0 0 ${width} ${height}`}
          onClick={pick}
        >
          <rect
            x={left}
            y={top}
            width={right - left}
            height={bottom - top}
            fill="#16272d"
            stroke="#64777a"
          />
          <g className="tutor-ticks">
            <text x={left - 8} y={top - 4} textAnchor="end">
              {axis === "mag" ? "dB" : "°"}
            </text>
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(v)}
                  y2={y(v)}
                  className={
                    v === 0 || (axis === "phase" && v === -180)
                      ? "reference"
                      : ""
                  }
                />
                <text
                  x={left - 8}
                  y={y(v)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {v}
                  {axis === "phase" ? "°" : ""}
                </text>
              </g>
            ))}
            {xTicks.map((e) => (
              <g key={e}>
                <line x1={x(10 ** e)} x2={x(10 ** e)} y1={top} y2={bottom} />
                {(!learningSum || confirmedFrequencies.has(10 ** e)) && <foreignObject x={Math.min(width-38, Math.max(0,x(10 ** e)-19))} y={bottom+3} width={38} height={24}>
                  <div className="tutor-decade"><RouthMath latex={e === 0 ? "1" : `10^{${e}}`}/></div>
                </foreignObject>}
              </g>
            ))}
            <text x={right} y={height - 5} textAnchor="end">
              ω (rad/s)
            </text>
          </g>
          {background
            .filter((l) => !["marker", "pole", "zero"].includes(l.style))
            .map(draw)}
          <g>
            {layers
              .filter((l) => l.style === "pole" || l.style === "zero")
              .map(draw)}
          </g>
          {view === "suma" && sum && draw(sum, -1)}
          {view === "suma" &&
            sum &&
            sum.points.map(([w, v]) => (
              <g key={w} data-confirmed-frequency={w}>
                <circle cx={x(w)} cy={y(v)} r={2.7} fill={sum.color} />
                <text
                  x={x(w)}
                  y={y(v) - 6}
                  fill={sum.color}
                  fontSize={8}
                  textAnchor="middle"
                >
                  {Number(v.toFixed(1))}
                  {axis === "phase" ? "°" : ""}
                </text>
              </g>
            ))}
          <g>{readings.filter((layer) => layer.style === "exact").map(draw)}</g>
          <g>{layers.filter((layer) => layer.style === "marker").map(draw)}</g>
          {picked &&
            picked >= exercise.range[0] &&
            picked <= exercise.range[1] && (
              <line
                x1={x(picked)}
                x2={x(picked)}
                y1={top}
                y2={bottom}
                stroke="#fff"
                strokeDasharray="3 4"
              />
            )}
        </svg>
      </div>
      <ul className="tutor-legend" aria-label="Trazos confirmados">
        {(learningSum ? (sum ? [sum] : []) : layers)
          .filter(
            (layer) =>
              layer.style !== "slope" && layer.style !== "frequency" &&
              layer.style !== "pole" &&
              layer.style !== "zero",
          )
          .map((layer, i) => (
            <li key={i}>
              <i data-style={layer.style} style={{ color: layer.color }} />
              {layer.label}
            </li>
          ))}
      </ul>
    </>
  );
}
