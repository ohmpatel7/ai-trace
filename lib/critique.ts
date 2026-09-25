/**
 * Critique rules. Each label is a plain word-count rule so a grader or student
 * can always see why a step was labelled the way it was.
 */
import { config } from "./config";
import { countWords } from "./overlap";

export type StepAction = "accepted" | "edited" | "rejected" | "verified_elsewhere";

export type CritiqueLabel =
  | "no_critique"
  | "accepted_without_evaluation"
  | "thin_critique"
  | "substantive_critique";

export const CRITIQUE_LABELS: Record<CritiqueLabel, string> = {
  no_critique: "No critique recorded",
  accepted_without_evaluation: "Accepted without evaluation",
  thin_critique: "Thin critique",
  substantive_critique: "Substantive critique",
};

/** The rule behind each label, shown on hover and in the info panel. */
export const CRITIQUE_RULES: Record<CritiqueLabel, string> = {
  no_critique: "The critique field is empty.",
  accepted_without_evaluation: `The action is "accepted" and the critique has fewer than ${config.thinWords} words.`,
  thin_critique: `The critique has fewer than ${config.thinWords} words.`,
  substantive_critique: `The critique has ${config.thinWords} words or more.`,
};

export const ACTION_LABELS: Record<StepAction, string> = {
  accepted: "Accepted",
  edited: "Edited",
  rejected: "Rejected",
  verified_elsewhere: "Verified elsewhere",
};

export function critiqueLabel(critique: string, action: StepAction, thinWords: number = config.thinWords): CritiqueLabel {
  const words = countWords(critique);
  if (words === 0) return "no_critique";
  if (words < thinWords) return action === "accepted" ? "accepted_without_evaluation" : "thin_critique";
  return "substantive_critique";
}

export interface StepCritique {
  iterationId: number;
  seq: number;
  words: number;
  label: CritiqueLabel;
}

export interface CritiqueSummary {
  steps: StepCritique[];
  /** Median critique word count across the submission's steps; null when no steps. */
  depth: number | null;
  counts: Record<CritiqueLabel, number>;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summariseCritiques(
  iterations: { id: number; seq: number; critique: string; action: StepAction }[],
  thinWords: number = config.thinWords,
): CritiqueSummary {
  const counts: Record<CritiqueLabel, number> = {
    no_critique: 0,
    accepted_without_evaluation: 0,
    thin_critique: 0,
    substantive_critique: 0,
  };
  const steps = iterations.map((it) => {
    const label = critiqueLabel(it.critique, it.action, thinWords);
    counts[label] += 1;
    return { iterationId: it.id, seq: it.seq, words: countWords(it.critique), label };
  });
  return { steps, depth: median(steps.map((s) => s.words)), counts };
}
