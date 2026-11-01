import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import type { Data, Layout } from "plotly.js";
import type { ChartView } from "./types";
export type ChartHandle = HTMLDivElement;
export default function Chart({
  id,
  data,
  layout,
  onHover,
  onClick,
  onRelayout,
  revision,
  viewState,
  onViewChange,
}: {
  revision?: number;
  viewState?: ChartView;
  onViewChange?: (view: ChartView) => void;
  id: string;
  data: Data[];
  layout: Partial<Layout>;
  onHover?: (x: number) => void;
  onClick?: (p: {
    curveNumber: number;
    pointNumber: number;
    x: number;
    y: number;
  }) => void;
  onRelayout?: (v: Record<string, unknown>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const events = useRef({ onHover, onClick, onRelayout, onViewChange });
  events.current = { onHover, onClick, onRelayout, onViewChange };
  useEffect(() => {
    const el = ref.current!;
    let active = true;
    Plotly.react(
      el,
      data,
      {
        paper_bgcolor: "transparent",
        plot_bgcolor: "#101b2c",
        font: { family: "Segoe UI, sans-serif", color: "#91a8c5", size: 11 },
        margin: { l: 65, r: 25, t: 30, b: 55 },
        autosize: true,
        hovermode: "closest",
        uirevision: id,
        ...layout,
        ...Object.fromEntries(
          Object.entries(viewState || {}).map(([axis, value]) => [
            axis,
            { ...((layout[axis as keyof Layout] as object) || {}), ...value },
          ]),
        ),
      },
      {
        responsive: true,
        displaylogo: false,
        scrollZoom: true,
        edits: {
          shapePosition: !!layout.shapes?.some(
            (shape) => (shape as { editable?: boolean }).editable,
          ),
        },
        modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
      },
    ).then(() => {
      if (!active) return;
      el.dataset.revision = String(revision ?? 0);
      const node = el as unknown as {
        removeAllListeners: (s: string) => void;
        on: (s: string, f: (e: any) => void) => void;
      };
      node.removeAllListeners("plotly_hover");
      node.removeAllListeners("plotly_click");
      node.removeAllListeners("plotly_relayout");
      node.on("plotly_hover", (e) =>
        events.current.onHover?.(Number(e.points?.[0]?.x)),
      );
      node.on("plotly_click", (e) => {
        const p = e.points?.[0];
        if (p) events.current.onClick?.(p);
      });
      node.on("plotly_relayout", (e) => {
        const next: ChartView = {};
        for (const axis of ["xaxis", "yaxis", "xaxis2", "yaxis2"] as const) {
          if (e[axis + ".autorange"] === true) next[axis] = { autorange: true };
          else if (e[axis + ".range"])
            next[axis] = { range: e[axis + ".range"], autorange: false };
          else if (
            e[axis + ".range[0]"] !== undefined &&
            e[axis + ".range[1]"] !== undefined
          )
            next[axis] = {
              range: [e[axis + ".range[0]"], e[axis + ".range[1]"]],
              autorange: false,
            };
        }
        if (Object.keys(next).length) events.current.onViewChange?.(next);
        events.current.onRelayout?.(e);
      });
    });
    return () => {
      active = false;
    };
  }, [data, layout, id, viewState]);
  useEffect(() => {
    const el=ref.current!;
    let frame=0, previousWidth=0;
    const observer=new ResizeObserver(entries=>{
      const width=entries[0]?.contentRect.width||0;
      if(Math.abs(width-previousWidth)<1)return;
      previousWidth=width;
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{if(el.isConnected)Plotly.Plots.resize(el);});
    });
    observer.observe(el);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[]);
  useEffect(
    () => () => {
      if (ref.current) Plotly.purge(ref.current);
    },
    [],
  );
  return <div className="plot" id={id} ref={ref} />;
}
export async function exportChart(id: string, format: "png" | "svg") {
  const el = document.getElementById(id);
  if (!el) throw Error("No hay un gráfico disponible.");
  await Plotly.downloadImage(el, {
    format,
    filename: `controllab-${id}`,
    width: 1400,
    height: id === "bode-chart" ? 900 : 720,
  });
}
