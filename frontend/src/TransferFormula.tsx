import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { transferLatex } from "./math";
import type { Model } from "./types";
export default function TransferFormula({
  model,
  label,
  className = "",
}: {
  model: Model | null | undefined;
  label: string;
  className?: string;
}) {
  const latex = model ? transferLatex(model.num, model.den, label) : "";
  const html = useMemo(
    () =>
      latex
        ? katex.renderToString(latex, {
            throwOnError: false,
            strict: "error",
            trust: false,
            displayMode: true,
            output: "htmlAndMathml",
          })
        : "",
    [latex],
  );
  if (!model)
    return (
      <div className={"formula " + className}>Esperando un modelo válido…</div>
    );
  return (
    <div
      className={"formula transferformula " + className}
      tabIndex={0}
      role="region"
      aria-label={`Función de transferencia ${label.replaceAll("\\", "")}`}
      title={model.expression}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
