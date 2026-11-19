import type { Step } from "./session";

export type Topic =
  | "Bode directo"
  | "Routh y LGR"
  | "Álgebra de bloques"
  | "Laplace y error estacionario";
export type Exercise = {
  id: string;
  page: string | number;
  topic: Topic;
  formula?: string;
  prompt: string;
  steps: Step[];
  note?: string;
  partial?: { title: string };
};

export function partial(title: string) {
  return { title };
}

export type Question = Omit<Step, "id">;

export function questions(id: string, items: Question[]): Step[] {
  return items.map((item, i) => ({ ...item, id: id + "." + (i + 1) }));
}

export function numeric(
  concept: string,
  prompt: string,
  value: number,
  hint: string,
  explanation: string,
  unit?: string,
  tolerance?: number,
): Question {
  return {
    concept,
    prompt,
    answer: { value, unit, tolerance },
    hint,
    explanation,
  };
}

export function expression(
  concept: string,
  prompt: string,
  answer: string,
  hint: string,
  explanation: string,
): Question {
  return { concept, prompt, answer, hint, explanation, expression: true };
}

export function choose(
  concept: string,
  prompt: string,
  choices: string[],
  correct: number,
  hint: string,
  explanation: string,
): Question {
  return {
    concept,
    prompt,
    choices,
    answer: choices[correct],
    hint,
    explanation,
  };
}
