import { VERDICT_LABELS, type StepCheck } from "@/lib/llm-labels";

/** The LLM reflection check's suggestion for one step. Advisory; the grader decides. */
export function LlmChip({ check }: { check: StepCheck | undefined }) {
  if (!check) return <span className="chip plain" title="The LLM reflection check has not run on this step.">LLM: not checked</span>;
  if (!check.current) return <span className="chip plain" title="This step changed after it was checked. Run the check again.">LLM: changed since check</span>;
  return (
    <span className={`chip ${check.verdict === "look_closer" ? "tier-amber" : "tier-green"}`} title={`${check.reason} (LLM suggestion, ${check.model})`}>
      LLM: {VERDICT_LABELS[check.verdict]}
    </span>
  );
}
