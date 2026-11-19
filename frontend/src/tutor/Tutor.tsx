import { DraftFormula, TutorFormula, TutorText } from "./TutorMath";
import AnswerField from "./AnswerField";
import GraphicPanel from "./GraphicPanel";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BodeGraph from "./BodeGraph";
import { bodeExercises } from "./bode";

import { blockExercises, blockReductions, finalDiagram } from "./blocks";
import type { Exercise, Topic } from "./exercise";
import { laplaceExercises } from "./laplace";
import { guidedLocusExercises, locusExercises, routhCells, routhExercise } from "./locus";
import { BlockGraph, LocusGraph, RouthTable } from "./PracticeGraphics";
import {
  accepts,
  display,
  examStep,
  readSession,
  saveSession,
  start,
  submit,
} from "./session";
import type { Attempt, Mode, Step } from "./session";
import "./tutor.css";

const modes: Mode[] = ["Inicial", "Intermedio", "Examen"];
const topics: Topic[] = [
  "Bode directo",
  "Routh y LGR",
  "Álgebra de bloques",
  "Laplace y error estacionario",
];
const exercises: Exercise[] = [
  ...bodeExercises,
  routhExercise,
  ...locusExercises,
  ...blockExercises,
  ...laplaceExercises,
];

function status(attempt?: Attempt) {
  if (!attempt) return "Pendiente";
  if (attempt.review) return "Para repasar";
  if (!attempt.complete) return "En curso";
  if (attempt.mode === "Examen") return "Examen entregado";
  return attempt.hints.length ||
    attempt.log.some((e) => e.outcome === "assisted")
    ? "Completado con ayuda"
    : "Completado sin ayuda";
}

function options(step: Step, mode: Mode) {
  let values = step.choices;
  if (
    !values &&
    mode === "Inicial" &&
    !step.pick &&
    typeof step.answer === "object"
  ) {
    const { value } = step.answer;
    const offset = value
      ? Math.max(Math.abs(value) * 0.5, 0.1)
      : step.answer.unit
        ? 10
        : 1;
    values = [value, value - offset, value + offset].map((v) =>
      display({ ...(step.answer as object), value: v }),
    );
  }
  if (!values) return;
  const shift =
    [...step.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}

function Theory() {
  return (
    <details className="tutor-theory">
      <summary>Consultar teoría del apunte · pp. 44–56</summary>
      <dl>
        <dt>Acción integral</dt>
        <dd>
          Aumenta el tipo del lazo al añadir un integrador. Verificá la
          estabilidad del cierre antes de concluir sobre el error estacionario.
        </dd>
        <dt>Acción proporcional y derivativa</dt>
        <dd>
          Una ganancia positiva traslada la magnitud en dB. La acción derivativa
          puede aportar adelanto de fase y amplificar ruido de alta frecuencia.
        </dd>
        <dt>Compensador de adelanto</dt>
        <dd>
          Su cero aparece antes que el polo. Ubicá el aporte positivo de fase
          alrededor del nuevo cruce de 0 dB y volvé a medir el margen.
        </dd>
        <dt>Compensador de atraso</dt>
        <dd>
          Su polo aparece antes que el cero. Aumenta la ganancia relativa de
          baja frecuencia. Revisá el atraso de fase cerca del cruce.
        </dd>
        <dt>Ajuste de PID</dt>
        <dd>
          En lazo abierto, el método de la curva de reacción usa el escalón de
          la planta. En lazo cerrado, el método de ganancia última usa la
          ganancia y el período de oscilación sostenida, cuando existen.
        </dd>
      </dl>
    </details>
  );
}

export default function Tutor() {
  const [session, setSession] = useState(readSession);
  const latest = useRef(session);
  const locked = useRef<Step | undefined>(undefined);
  const exercisePanel = useRef<HTMLElement>(null);
  const stepForm = useRef<HTMLFormElement>(null);
  const responseField = useRef<HTMLInputElement>(null);
  const [persistent, setPersistent] = useState(true);
  const [mode, setMode] = useState<Mode>("Intermedio");
  const [topic, setTopic] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [past, setPast] = useState<number | null>(null);
  const [picked, setPicked] = useState<number>();
  const [diagramIndex, setDiagramIndex] = useState<number>();
  const [retry, setRetry] = useState<{ draft: string; verdict?: boolean }>();
  const attempt = session.attempts.find((item) => item.id === session.selected);
  const exercise = exercises.find((e) => e.id === attempt?.exercise);
  const bode = bodeExercises.find((e) => e.id === exercise?.id);
  const locus = (attempt?.route === "lgr-guiado" ? guidedLocusExercises : locusExercises).find((e) => e.id === exercise?.id);
  const block = blockExercises.find((e) => e.id === exercise?.id);
  const routhOnly = attempt?.route === "routh";
  const reduction = block && attempt?.route === "reduccion" ? blockReductions[block.id] : undefined;
  const steps =
    (routhOnly
      ? locus?.routh.steps
      : attempt?.route === "visual"
        ? block?.alternate?.steps
        : reduction?.steps ?? locus?.steps ?? exercise?.steps) ?? [];
  const step = attempt && steps[attempt.step];
  const showingAnswer = !!step && attempt?.revealedStep === step.id;
  const exam = attempt?.mode === "Examen";
  const last = attempt?.log.at(-1);
  const wrong = !exam && last?.outcome === "wrong" && last.step === attempt?.step && last.response === attempt?.draft;
  const axis =
    attempt?.axis ?? (step && /fase/i.test(step.concept) ? "phase" : "mag");

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const panel = exercisePanel.current;
      if (!panel || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.isComposing) return;
      const key = event.key.toUpperCase();
      if (!["1", "2", "3", "4", "P", "R"].includes(key)) return;
      const button = panel.querySelector<HTMLButtonElement>(`button[aria-keyshortcuts="Alt+${key}"]:not(:disabled)`);
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (key === "P" || key === "R") {
        panel.querySelector<HTMLDialogElement>("dialog[open]")?.close();
        button.scrollIntoView({block: "nearest"});
      }
      button.click();
    }
    window.addEventListener("keydown", shortcut, true);
    return () => window.removeEventListener("keydown", shortcut, true);
  }, []);

  useLayoutEffect(() => {
    const form = stepForm.current;
    if (form && !document.querySelector("dialog[open]")) {
      (form.querySelector<HTMLButtonElement>("[data-continue]") ?? form.querySelector<HTMLInputElement>("input:checked") ?? form.querySelector<HTMLInputElement>("input"))?.focus();
    }
  }, [attempt?.id, step?.id, showingAnswer]);

  function update(next: typeof session) {
    latest.current = next;
    setSession(next);
    setPersistent(saveSession(next));
  }
  function change(next: Attempt) {
    const current = latest.current;
    update({
      ...current,
      attempts: current.attempts.map((a) => (a.id === next.id ? next : a)),
    });
  }
  function open(next: Attempt) {
    const current = latest.current;
    locked.current = undefined;
    setPast(null);
    setPicked(undefined);
    setDiagramIndex(undefined);
    setHintOpen(false);
    setSolutionOpen(false);
    setRetry(undefined);
    const exists = current.attempts.some((a) => a.id === next.id);
    update({
      ...current,
      selected: next.id,
      attempts: exists ? current.attempts : [...current.attempts, next],
    });
  }
  function select(
    id: string,
    selectedMode: Mode,
    route?: string,
    repeat = false,
  ) {
    const current = latest.current;
    const previous = repeat
      ? undefined
      : current.attempts
          .filter(
            (a) =>
              a.exercise === id && a.mode === selectedMode && a.route === route,
          )
          .at(-1);
    open(previous ?? { ...start(id, selectedMode), route });
  }
  function revealAnswer() {
    if (attempt && step && !exam) change({ ...attempt, revealedStep: step.id });
  }
  function submitCurrent(response: string, assisted = false) {
    const current = latest.current.attempts.find(
      (a) => a.id === latest.current.selected,
    );
    if (
      !current ||
      !step ||
      current.id !== attempt?.id ||
      current.step !== attempt.step ||
      locked.current === step
    )
      return;
    const next = submit(current, steps, response, assisted);
    if (next === current) return;
    if (next.step !== current.step) {
      locked.current = step;
      setHintOpen(false);
      setPast(null);
      setPicked(undefined);
      setDiagramIndex(undefined);
      const nextStep = steps[next.step];
      if (bode && nextStep) {
        next.axis =
          /fase/i.test(nextStep.concept) || nextStep.prompt.includes("−180°")
            ? "phase"
            : nextStep.pick === "frequency"
              ? "mag"
              : next.axis;
      }
    }
    change(next);
    if (next.step === current.step) responseField.current?.focus();
  }
  function choosePoint(value: number) {
    if (!attempt) return;
    setPicked(value);
    change({ ...attempt, draft: Number(value.toPrecision(5)).toString() });
  }

  const storageNote = !persistent && (
    <p role="alert">El navegador no pudo guardar este intento.</p>
  );
  if (!exercise || !attempt) {
    const pending = session.attempts.filter((item) => !item.complete).at(-1);
    return (
      <main className="tutor">
        <header className="tutor-title">
          <h1>Tutor de Control Automático</h1>
          <p>Elegí un tema y un nivel para practicar los ejercicios del apunte.</p>
          {pending && (
            <button className="tutor-confirm" onClick={() => open(pending)}>
              Reanudar {pending.exercise} · {pending.mode}
            </button>
          )}
        </header>
        {storageNote}
        <div className="tutor-filters">
          <label>
            Tema
            <select
              aria-label="Tema"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">Todos</option>
              {topics.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Dificultad
            <select
              aria-label="Dificultad"
              value={mode}
              onChange={(e) => setMode(modes[e.target.selectedIndex])}
            >
              {modes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        {topics
          .filter((group) => !topic || group === topic)
          .map((group) => (
            <section key={group} className="tutor-catalog">
              <h2>{group}</h2>
              {[false, true].map((partialGroup) => (
                <div key={String(partialGroup)}>
                  {partialGroup && <h3>Práctica tipo parcial</h3>}
                  {exercises
                    .filter((item) => item.topic === group && Boolean(item.partial) === partialGroup)
                    .map((item) => {
                      const route = item.partial ? undefined
                        : item.topic === "Álgebra de bloques" ? "reduccion"
                        : mode !== "Examen" && locusExercises.some(e => e.id === item.id) ? "lgr-guiado" : undefined;
                      const attempts = session.attempts.filter(
                        (a) => a.exercise === item.id && a.mode === mode,
                      );
                      const previous = attempts.filter((a) => a.route === route).at(-1) ??
                        attempts.filter((a) => !a.route).at(-1);
                      return (
                        <div
                          key={item.id}
                          className="tutor-row"
                          data-exercise={item.id}
                        >
                          <strong>{item.id}</strong>
                          <span>
                            {item.partial && <>{item.partial.title} · </>}
                            {item.id === "B6" ? item.page : "p. " + item.page}
                          </span>
                          <span>
                            {status(previous)}
                            {item.id === "B1" && !previous && mode === "Intermedio"
                              ? " · Sugerido"
                              : ""}
                          </span>
                          <button
                            aria-label={
                              (previous ? "Abrir intento " : "Empezar ") + item.id
                            }
                            onClick={() => previous ? open(previous) : select(item.id, mode, route)}
                          >
                            {previous ? "Abrir intento" : "Empezar"}
                          </button>
                        </div>
                      );
                    })}
                </div>
              ))}
            </section>
          ))}
        <Theory />
      </main>
    );
  }

  const reviewIndex =
    past ?? (last && last.step < attempt.step ? last.step : null);
  const reviewStep =
    reviewIndex === null
      ? undefined
      : exam
        ? examStep(steps, reviewIndex, attempt.log)
        : steps[reviewIndex];
  const progress = exam && !attempt.complete ? 0 : attempt.step;
  const allowPick = !!step?.pick && !attempt.complete && !exam && !showingAnswer;
  const targetAxis =
    step?.concept === "Transición de fase" ||
    (step?.prompt.includes("encuentro") && step.prompt.includes("−180°"))
      ? "phase"
      : "mag";
  const choices = step && options(step, attempt.mode);
  const previousStep =
    last && last.step < attempt.step ? steps[last.step] : undefined;
  const examCorrect =
    attempt.complete && exam
      ? attempt.log.filter((e) =>
          accepts(examStep(steps, e.step, attempt.log), e.response),
        ).length
      : 0;
  const summing = !exam && (axis === "mag"
    ? ["Magnitud inicial", "Suma por intervalos", "Cambio de pendiente", "Continuidad"].includes(step?.concept ?? "")
    : step?.concept === "Suma de fase");
  const visibleSum = bode?.layers[axis]
    .filter(
      ([stage, layer]) =>
        stage < progress &&
        (layer.style === "partial" || layer.style === "total"),
    )
    .at(-1);
  const cells =
    exercise.id === "R1"
      ? routhExercise.cells
      : locus && (routhOnly ? locus.routh.cells : routhCells(locus));
  const variants = block
    ? [
        { title: "Diagrama original", diagram: block.diagram },
        ...(attempt.route === "visual"
          ? (block.alternate?.transformed ?? [])
          : (reduction?.transformed ?? block.transformed ?? [])
        ).filter((item) => item.stage < progress),
        ...(reduction ? [] : steps.slice(0, progress)).flatMap((s) =>
          s.concept === "Equivalente" && typeof s.answer === "string"
            ? [
                {
                  title:
                    s.prompt.match(/Escribí (.*?) como/)?.[1] ?? "Equivalente",
                  diagram: finalDiagram(s.answer, block.diagram, s.prompt),
                },
              ]
            : [],
        ),
      ]
    : [];
  const visibleDiagram =
    variants[diagramIndex ?? (step?.selectNode ? 0 : variants.length - 1)];
  const errors = [
    ...new Set(
      attempt.log
        .filter(
          (e) =>
            e.outcome === "wrong" ||
            (e.outcome === "exam" &&
              attempt.complete &&
              !accepts(examStep(steps, e.step, attempt.log), e.response)),
        )
        .map((e) => steps[e.step]?.concept)
        .filter(Boolean),
    ),
  ];
  const otherAttempts = session.attempts.filter(
    (a) => a.exercise === attempt.exercise && a.id !== attempt.id,
  );

  function recordHelp(index: number) {
    const a = latest.current.attempts.find((item) => item.id === attempt?.id);
    if (a && !a.hints.includes(index))
      change({ ...a, hints: [...a.hints, index] });
  }

  return (
    <main className="tutor" ref={exercisePanel}>
      <header className="tutor-title">
        <button onClick={() => update({ ...latest.current, selected: null })}>
          ← Índice
        </button>
        <h1>
          {exercise.id} · {exercise.partial?.title ?? exercise.topic}
        </h1>
        <p>
          {exercise.partial && "Práctica tipo parcial · "}
          {exercise.id === "B6" ? exercise.page : "Página " + exercise.page} · {attempt.mode} · {status(attempt)}
        </p>
        {exercise.formula && (
          <p className="tutor-formula"><TutorFormula value={exercise.formula}/></p>
        )}
        <p><TutorText value={reduction ? "Simplificá el esquema paso a paso hasta obtener el bloque equivalente." : exercise.prompt}/></p>
        {block && <details><summary>Reglas de simplificación · tabla 4-3</summary>
          <p>1–2: reordenar y separar sumadores · 3–4: conmutar y agrupar bloques en serie · 5: combinar ramas en paralelo · 6–7: trasladar sumadores compensando la rama lateral.</p>
          <img src={new URL("../../../docs/pdf/diagrama de bloques.png", import.meta.url).href} alt="Tabla 4-3. Cada fila muestra el esquema original y su equivalente." style={{maxWidth:"100%", height:"auto"}}/>
        </details>}
        <div className="tutor-actions">
          {locus && !exam && !routhOnly && attempt.route !== "lgr-guiado" && <button onClick={() => select(exercise.id,attempt.mode,"lgr-guiado")}>Practicar K con guía</button>}
          {locus && (
            <button
              onClick={() =>
                select(
                  exercise.id,
                  attempt.mode,
                  routhOnly ? (exam || exercise.partial ? undefined : "lgr-guiado") : "routh",
                )
              }
            >
              {routhOnly ? "Práctica completa de LGR" : "Practicar solo Routh"}
            </button>
          )}
          {block && !block.partial && !reduction && (
            <button
              onClick={() =>
                select(
                  exercise.id,
                  attempt.mode,
                  "reduccion",
                )
              }
            >
              Practicar por simplificación
            </button>
          )}
        </div>
      </header>
      {storageNote}
      <div
        className={
          "tutor-work" +
          (!bode && !locus && !block && !cells ? " tutor-text-only" : "")
        }
      >
        <section className="tutor-card" aria-label="Práctica">
          <progress
            value={attempt.step}
            max={steps.length}
            aria-label="Pasos respondidos"
          />
          {step && !attempt.complete && (
            <>
              {!exam && previousStep && (
                <p role="status" className="tutor-feedback">
                  <strong>
                    {last?.outcome === "assisted"
                      ? "Resuelto con ayuda"
                      : "Paso confirmado"}
                  </strong>{" "}
                  · <TutorText value={previousStep.explanation}/>
                </p>
              )}
              <p className="tutor-step">
                Paso {attempt.step + 1} de {steps.length} · {step.concept}
              </p>
              <h2><TutorText value={exam ? (step.examPrompt ?? step.prompt) : step.prompt}/></h2>
              <form
                key={step.id}
                ref={stepForm}
                onKeyDown={event => {
                  if (showingAnswer || event.repeat || event.nativeEvent.isComposing || event.ctrlKey || event.metaKey) return;
                  if (choices && !event.altKey && /^[1-9]$/.test(event.key)) {
                    const radio = stepForm.current?.querySelectorAll<HTMLInputElement>("input[type=radio]")[Number(event.key)-1];
                    if (radio) { event.preventDefault(); radio.focus(); radio.click(); }
                  }
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  submitCurrent(showingAnswer ? display(step.answer) : attempt.draft, showingAnswer);
                }}
              >
                <fieldset className="tutor-current-answer" disabled={showingAnswer}>
                <AnswerField
                  step={step}
                  value={showingAnswer ? display(step.answer) : attempt.draft}
                  choices={choices}
                  inputRef={responseField}
                  focusError
                  error={wrong ? "Revisá tu respuesta y probá otra vez. " + step.hint : undefined}
                  onChange={(draft) => {
                    setPicked(undefined);
                    change({ ...attempt, draft });
                  }}
                />
                </fieldset>
                {showingAnswer ? <div className="tutor-revealed" role="status">
                  <strong>Respuesta correcta · {step.expression ? <DraftFormula value={display(step.answer)}/> : display(step.answer)}</strong>
                  <p><TutorText value={step.explanation}/></p>
                </div> : <small className="tutor-shortcuts">Enter para confirmar{choices ? " · 1–" + choices.length + " para elegir" : ""}{!exam && " · Alt+P pista · Alt+R resolver"}</small>}
                {allowPick && (
                  <p className="tutor-help">
                    Tocá{" "}
                    {step.pick === "real"
                      ? "el eje real"
                      : targetAxis === "mag"
                        ? "el gráfico de magnitud"
                        : "el gráfico de fase"}{" "}
                    o escribí el valor en el campo.
                  </p>
                )}
                <button
                  className="tutor-confirm"
                  data-continue={showingAnswer || undefined}
                  disabled={!showingAnswer && !attempt.draft.trim()}
                >
                  {showingAnswer ? "Continuar (Enter)" : exam ? "Guardar respuesta" : "Confirmar"}
                </button>
              </form>
              {!exam && !showingAnswer && (
                <div className="tutor-actions">
                  <button aria-keyshortcuts="Alt+P"
                    onClick={() => {
                      recordHelp(attempt.step);
                      setHintOpen(true);
                    }}
                  >
                    Ver pista
                  </button>
                  <button
                    aria-keyshortcuts="Alt+R" onClick={revealAnswer}
                  >
                    Resolver este paso
                  </button>
                </div>
              )}
              {!exam && (
                <div aria-live="polite">
                  {hintOpen && !wrong && (
                    <p className="tutor-help"><TutorText value={step.hint}/></p>
                  )}
                </div>
              )}
            </>
          )}
          {!step && exam && !attempt.complete && (
            <>
              <h2>Entregar examen</h2>
              <p>Guardaste {steps.length} respuestas. Entregá el examen para ver la corrección.</p>
              <button
                className="tutor-confirm"
                onClick={() => change({ ...attempt, complete: true })}
              >
                Entregar y corregir
              </button>
            </>
          )}
          {attempt.complete && (
            <div>
              <h2>Resultado del intento</h2>
              {exam ? (
                <p>
                  {examCorrect} de {steps.length} respuestas correctas.
                </p>
              ) : (
                <p>
                  {status(attempt)}.{" "}
                  {attempt.log.filter((e) => e.outcome === "assisted").length}{" "}
                  pasos resueltos con ayuda.
                </p>
              )}
              {!!errors.length && (
                <p>Te conviene repasar {errors.join(", ")}.</p>
              )}
              {exercise.note && <p>{exercise.note}</p>}
              <div className="tutor-actions">
                <button
                  aria-pressed={attempt.review}
                  onClick={() =>
                    change({ ...attempt, review: !attempt.review })
                  }
                >
                  {attempt.review ? "Quitar de repaso" : "Marcar para repaso"}
                </button>
                <button
                  onClick={() =>
                    select(attempt.exercise, attempt.mode, attempt.route, true)
                  }
                >
                  Repetir ejercicio
                </button>
              </div>
            </div>
          )}
          {(!exam || attempt.complete) &&
            reviewStep &&
            reviewIndex !== null && (
              <details className="tutor-review" key={attempt.id}>
                <summary>Pasos respondidos</summary>
                <label>
                  Revisar paso
                  <select
                    value={reviewIndex}
                    onChange={(event) => {
                      setPast(Number(event.target.value));
                      setRetry(undefined);
                    }}
                  >
                    {steps.slice(0, attempt.step).map((s, i) => (
                      <option key={s.id} value={i}>
                        {i + 1} · {s.concept}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  <TutorText value={exam ? (reviewStep.examPrompt ?? reviewStep.prompt) : reviewStep.prompt}/>
                </p>
                <ul>
                  {attempt.log
                    .filter((e) => e.step === reviewIndex)
                    .map((e, i) => (
                      <li key={i}>
                        {e.response} ·{" "}
                        {e.outcome === "assisted"
                          ? "Asistido"
                          : accepts(reviewStep, e.response)
                            ? "Correcto"
                            : "Incorrecto"}
                      </li>
                    ))}
                </ul>
                <p>
                  <strong>{reviewStep.expression ? <DraftFormula value={display(reviewStep.answer)}/> : display(reviewStep.answer)}</strong> ·{" "}
                  <TutorText value={reviewStep.explanation}/>
                </p>
                {retry ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setRetry({
                        ...retry,
                        verdict: accepts(reviewStep, retry.draft),
                      });
                    }}
                  >
                    <AnswerField
                      key={reviewStep.id}
                      step={reviewStep}
                      label="Respuesta de repaso"
                      value={retry.draft}
                      choices={reviewStep.choices}
                      error={retry.verdict === false ? reviewStep.hint : undefined}
                      onChange={(draft) => setRetry({ draft })}
                    />
                    <button disabled={!retry.draft.trim()}>
                      Comprobar repaso
                    </button>
                    {retry.verdict === true && (
                      <p role="status">
                        Correcto
                      </p>
                    )}
                  </form>
                ) : (
                  <button onClick={() => setRetry({ draft: "" })}>
                    Repetir este paso
                  </button>
                )}
              </details>
            )}
          {(!exam || attempt.complete) && (
            <details
              key={attempt.id + "-solution"}
              open={solutionOpen}
              onToggle={(event) => {
                const open = event.currentTarget.open;
                setSolutionOpen(open);
                if (open && !attempt.complete) recordHelp(-1);
              }}
            >
              <summary>Ver resolución completa</summary>
              {solutionOpen && (
                <ol>
                  {steps.map((s) => (
                    <li key={s.id}>
                      <p><TutorText value={s.prompt}/></p>
                      <strong>{s.expression ? <DraftFormula value={display(s.answer)}/> : display(s.answer)}</strong> · <TutorText value={s.explanation}/>
                    </li>
                  ))}
                </ol>
              )}
            </details>
          )}
          {!!otherAttempts.length && (
            <details>
              <summary>Historial de intentos</summary>
              <label>
                Elegir intento
                <select
                  value=""
                  onChange={(event) => {
                    const item = otherAttempts.find(
                      (a) => a.id === event.target.value,
                    );
                    if (item) open(item);
                  }}
                >
                  <option value="" disabled>
                    Elegí un intento
                  </option>
                  {otherAttempts.map((a, i) => (
                    <option key={a.id} value={a.id}>
                      {i + 1} · {a.mode} · {status(a)}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          )}
          {attempt.complete && <Theory />}
        </section>

        {(bode || (locus && !routhOnly) || cells || block) && (
          <GraphicPanel key={attempt.id}>
            {bode && (
              <>
                {progress > 0 && (
                  <details>
                    <summary>Factores identificados</summary>
                    <ul className="tutor-legend">
                      {bode.identified
                        .filter((f) => f.stage < progress)
                        .map((f) => (
                          <li key={f.stage}>
                            <i style={{ color: f.color }} />
                            {f.label}
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
                <div className="tutor-actions">
                  <button
                    aria-keyshortcuts="Alt+1" aria-pressed={axis === "mag"}
                    onClick={() => change({ ...attempt, axis: "mag" })}
                  >
                    Magnitud
                  </button>
                  <button
                    aria-keyshortcuts="Alt+2" aria-pressed={axis === "phase"}
                    onClick={() => change({ ...attempt, axis: "phase" })}
                  >
                    Fase
                  </button>
                </div>
                <small className="tutor-shortcuts">Alt+1 magnitud · Alt+2 fase · Alt+3 aportes · Alt+4 suma por rectas</small>
                <BodeGraph
                  key={axis + String(summing)}
                  summing={summing}
                  exercise={bode}
                  axis={axis}
                  progress={progress}
                  picked={picked}
                  onPick={
                    allowPick && axis === targetAxis ? choosePoint : undefined
                  }
                />
                {visibleSum && (
                  <details>
                    <summary>Tabla de la suma confirmada</summary>
                    {axis === "mag" ? (
                      <table>
                        <thead>
                          <tr>
                            <th>Tramo (rad/s)</th>
                            <th>dB/década</th>
                            <th>dB al final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bode.intervals
                            .filter((row) => row.stage < progress)
                            .map((row) => (
                              <tr key={row.stage}>
                                <td>
                                  {row.start} → {row.end}
                                </td>
                                <td>{row.slope}</td>
                                <td>{row.magnitude}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>ω (rad/s)</th>
                            <th>°</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSum[1].points.map(([w, v]) => (
                            <tr key={w}>
                              <td>{w}</td>
                              <td>{Number(v.toPrecision(5))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </details>
                )}
              </>
            )}
            {locus && !routhOnly && (
              <LocusGraph
                exercise={locus}
                progress={progress}
                picked={picked}
                onPick={allowPick ? choosePoint : undefined}
              />
            )}
            {cells &&
              (!locus ||
                routhOnly ||
                attempt.step >=
                  locus.steps.length - locus.routh.steps.length) && (
                <RouthTable
                  cells={cells}
                  progress={progress}
                  currentStep={attempt.complete ? undefined : attempt.step}
                  onSelect={() => {
                    const dialog = document.querySelector<HTMLDialogElement>(".tutor-dialog[open]");
                    dialog?.close();
                    if (dialog) dialog.addEventListener("close", () => responseField.current?.focus(), { once: true });
                    else responseField.current?.focus();
                  }}
                />
              )}
            {block && (
              <>
                {variants.length > 1 && (
                  <label>
                    Esquema
                    <select
                      value={variants.indexOf(visibleDiagram)}
                      onChange={(event) =>
                        setDiagramIndex(Number(event.target.value))
                      }
                    >
                      {variants.map(({ title }, index) => (
                        <option key={index} value={index}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <BlockGraph
                  diagram={visibleDiagram.diagram}
                  selectable={
                    step?.selectNode && !exam ? step.choices : undefined
                  }
                  picked={attempt.draft}
                  onPick={(name) => change({ ...attempt, draft: name })}
                />
              </>
            )}
          </GraphicPanel>
        )}
      </div>
    </main>
  );
}
