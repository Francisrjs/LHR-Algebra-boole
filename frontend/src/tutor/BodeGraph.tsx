import type { MouseEvent } from "react";
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
  onPick,
  picked,
}: {
  exercise: BodeExercise;
  axis: "mag" | "phase";
  progress: number;
  onPick?: (omega: number) => void;
  picked?: number;
}) {
  const [low, high] = exercise.range.map(Math.log10);
  const revealed = exercise.layers[axis].filter(([stage]) => stage < progress);
  const layers = revealed
    .filter(([, layer], index) => {
      if (layer.style !== "partial" && layer.style !== "total") return true;
      return !revealed
        .slice(index + 1)
        .some(([, next]) => next.style === "partial" || next.style === "total");
    })
    .map(([, layer]) => layer);
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
        strokeWidth={style === "total" ? 3 : 1.7}
        strokeDasharray={
          style === "factor" ? "3 4" : style === "partial" ? "9 4" : undefined
        }
        points={points.map(([w, v]) => `${x(w)},${y(v)}`).join(" ")}
      />
    );
  }
  return (
    <>
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
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={left}
                x2={right}
                y1={y(v)}
                y2={y(v)}
                className={
                  v === 0 || (axis === "phase" && v === -180) ? "reference" : ""
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
              <text x={x(10 ** e)} y={bottom + 21} textAnchor="middle">
                {e === 0 ? "1" : `10^${e}`}
              </text>
            </g>
          ))}
          <text x={right} y={height - 5} textAnchor="end">
            ω (rad/s)
          </text>
        </g>
        {layers.map(draw)}
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
        {layers
          .filter((layer) => layer.style !== "frequency")
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
