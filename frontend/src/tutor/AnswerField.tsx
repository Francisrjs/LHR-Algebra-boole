import { useId, useRef, useState } from "react";
import type { RefObject } from "react";
import BlockFormula from "../BlockFormula";
import type { Step } from "./session";

export default function AnswerField({
  step, value, onChange, choices, inputRef, label = "Tu respuesta", error, focusError,
}: {
  step: Step;
  value: string;
  onChange: (value: string) => void;
  choices?: string[];
  inputRef?: RefObject<HTMLInputElement | null>;
  label?: string;
  error?: string;
  focusError?: boolean;
}) {
  const id = useId();
  const localRef = useRef<HTMLInputElement>(null);
  const field = inputRef ?? localRef;
  const [pad, setPad] = useState(false);
  const numeric = typeof step.answer === "object";
  const unit = numeric && typeof step.answer === "object" ? step.answer.unit : undefined;
  const math = numeric || step.expression;
  const keys = [
    "-", "+", "*", "/", "^", "(", ")", ",", "sqrt(", "pi",
    ...(numeric ? ["log10(", "exp(", "sin(", "cos("] : ["s", "t", "K", "G", "H", "exp(", "sin(", "cos("]),
    ...(unit ? [unit, ...(unit === "rad/s" ? ["Hz"] : unit === "°" ? ["rad"] : [])] : []),
  ];

  function insert(key: string) {
    const start = field.current?.selectionStart ?? value.length;
    const end = field.current?.selectionEnd ?? start;
    const caret = start + key.length;
    onChange(value.slice(0, start) + key + value.slice(end));
    requestAnimationFrame(() => {
      if (field.current) field.current.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="tutor-answer">
      {choices ? (
        <fieldset aria-describedby={error ? id + "-error" : undefined}>
          <legend>Elegí una respuesta</legend>
          {choices.map((choice, index) => (
            <label key={choice} className="tutor-option">
              <input
                type="radio"
                name={id}
                checked={value === choice}
                aria-invalid={error ? true : undefined}
                ref={focusError && error && (value === choice || (!value && index === 0)) ? (node) => {
                  if (node && !node.closest("dialog")) node.focus();
                } : undefined}
                onChange={() => onChange(choice)}
              />
              {choice}
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <label htmlFor={id}>{label}</label>
          <div className="tutor-input-row">
            <input
              id={id}
              ref={field}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              inputMode={numeric ? "decimal" : "text"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={[math && id + "-format", error && id + "-error"].filter(Boolean).join(" ") || undefined}
            />
            {unit && <span className="tutor-unit">{unit}</span>}
          </div>
          {math && (
            <>
              <p id={id + "-format"} className="tutor-format">
                {numeric ? "Podés usar coma decimal o escribir un cálculo." : "Usá / para dividir y ^ para las potencias."}
              </p>
              <button type="button" aria-expanded={pad} aria-controls={id + "-pad"} onClick={() => setPad(!pad)}>
                {pad ? "Ocultar teclado matemático" : "Mostrar teclado matemático"}
              </button>
              <div className="tutor-keypad" id={id + "-pad"} hidden={!pad}>
                {keys.map((key) => (
                  <button key={key} type="button" aria-label={"Insertar " + key}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => insert(key)}>{key}</button>
                ))}
              </div>
            </>
          )}
          {step.expression && value.trim() && (
            <div className="tutor-preview" aria-label="Vista previa">
              <BlockFormula expression={value} />
            </div>
          )}
        </>
      )}
      <div aria-live="polite">{error && <p className="tutor-help tutor-error" id={id + "-error"}>{error}</p>}</div>
    </div>
  );
}
