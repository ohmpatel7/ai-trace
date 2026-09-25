import { CRITIQUE_LABELS, CRITIQUE_RULES, type CritiqueLabel } from "@/lib/critique";

export const CRITIQUE_CLASS: Record<CritiqueLabel, string> = {
  no_critique: "crit-no",
  accepted_without_evaluation: "crit-accepted",
  thin_critique: "crit-thin",
  substantive_critique: "crit-sub",
};

export function CritiqueChip({ label, words }: { label: CritiqueLabel; words?: number }) {
  return (
    <span className={`chip plain ${CRITIQUE_CLASS[label]}`} title={CRITIQUE_RULES[label]}>
      {CRITIQUE_LABELS[label]}
      {words !== undefined && <span className="muted">· {words} words</span>}
    </span>
  );
}
