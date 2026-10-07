/** Client-safe pieces of the LLM reflection check: labels and the per-step result shape. */
export type LlmVerdict = "considered" | "look_closer";

export const VERDICT_LABELS: Record<LlmVerdict, string> = {
  considered: "Looks considered",
  look_closer: "Look closer",
};

/** One step's check result as the grader screens show it. */
export interface StepCheck {
  verdict: LlmVerdict;
  reason: string;
  model: string;
  /** False when the step changed after it was checked. */
  current: boolean;
}
