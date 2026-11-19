import { equivalent, scalar } from "./expressions";

export type Mode = "Inicial" | "Intermedio" | "Examen";
type Numeric = {
  value: number;
  unit?: string;
  tolerance?: number;
  logarithmic?: boolean;
};
export type Step = {
  id: string;
  concept: string;
  prompt: string;
  answer: Numeric | string;
  choices?: string[];
  hint: string;
  explanation: string;
  pick?: "frequency" | "real";
  selectNode?: boolean;
  expression?: boolean;
  examPrompt?: string;
  gradeFromPrevious?: (response: number) => number;
};

export function display(answer: Step["answer"]) {
  if (typeof answer === "string") return answer;
  return [
    Number(answer.value.toPrecision(answer.tolerance === undefined ? 10 : 6)).toString().replace(".", ","),
    answer.unit,
  ]
    .filter(Boolean)
    .join(" ");
}

export function numberParts(input: string, answer: Numeric) {
  const expected = (answer.unit ?? "").toLowerCase();
  const units = [
    expected,
    ...(expected === "db/década" ? ["db/dc", "db/dec", "db/decada"] : []),
    ...(expected === "rad/s"
      ? ["hz"]
      : expected === "°"
        ? ["grados", "rad"]
        : []),
  ].filter(Boolean);
  const source = input.toLowerCase().replace(/\s+/g, "");
  const unit = units.find((u) => source.endsWith(u)) ?? "";
  return { expression: unit ? source.slice(0, -unit.length) : source, unit };
}

function numberResponse(input: string, answer: Numeric) {
  const { expression, unit } = numberParts(input, answer);
  const value = scalar(expression);
  return (
    value * (unit === "hz" ? 2 * Math.PI : unit === "rad" ? 180 / Math.PI : 1)
  );
}

export function accepts(step: Step, response: string) {
  const input = response.trim().replace(/[−–]/g, "-");
  const answer = step.answer;
  if (typeof answer === "string") {
    return step.expression
      ? equivalent(input, answer)
      : input.toLocaleLowerCase("es") ===
          answer.replace(/[−–]/g, "-").toLocaleLowerCase("es");
  }
  const actual = numberResponse(input, answer);
  if (!Number.isFinite(actual)) return false;
  const distance = answer.logarithmic
    ? Math.abs(Math.log10(actual / answer.value))
    : Math.abs(actual - answer.value);
  return (
    distance <= (answer.tolerance ?? 1e-8 * Math.max(1, Math.abs(answer.value)))
  );
}

export function examStep(
  steps: Step[],
  index: number,
  log: Submission[],
): Step {
  const step = steps[index];
  if (!step.gradeFromPrevious || typeof step.answer === "string") return step;
  const prior = steps[index - 1].answer;
  const response =
    log.find((entry) => entry.step === index - 1)?.response ?? "";
  const value =
    typeof prior === "string" ? NaN : numberResponse(response, prior);
  const expected = Number.isFinite(value) ? step.gradeFromPrevious(value) : NaN;
  return {
    ...step,
    answer: {
      ...step.answer,
      value: Number.isFinite(expected) ? expected : step.answer.value,
    },
  };
}

export type Submission = {
  step: number;
  response: string;
  outcome: "correct" | "wrong" | "assisted" | "exam";
};
export type Attempt = {
  revealedStep?: string;
  id: string;
  exercise: string;
  mode: Mode;
  step: number;
  complete: boolean;
  review: boolean;
  hints: number[];
  log: Submission[];
  draft: string;
  axis?: "mag" | "phase";
  route?: string;
};
type Session = { selected: string | null; attempts: Attempt[] };
const storageKey = "controllab.tutor.v1";
const empty: Session = { selected: null, attempts: [] };

export function readSession(): Session {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "null");
    return data && Array.isArray(data.attempts) ? data : empty;
  } catch {
    return empty;
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function start(exercise: string, mode: Mode): Attempt {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? Date.now() + "-" + Math.random(),
    exercise,
    mode,
    step: 0,
    complete: false,
    review: false,
    hints: [],
    log: [],
    draft: "",
  };
}

export function submit(
  attempt: Attempt,
  steps: Step[],
  response: string,
  assisted = false,
): Attempt {
  const current = steps[attempt.step];
  if (attempt.complete || !current || !response.trim()) return attempt;
  const outcome =
    attempt.mode === "Examen"
      ? "exam"
      : assisted
        ? "assisted"
        : accepts(current, response)
          ? "correct"
          : "wrong";
  const step = attempt.step + (outcome === "wrong" ? 0 : 1);
  return {
    ...attempt,
    step,
    revealedStep: undefined,
    log: [...attempt.log, { step: attempt.step, response, outcome }],
    draft: outcome === "wrong" ? response : "",
    complete: step === steps.length && attempt.mode !== "Examen",
  };
}
