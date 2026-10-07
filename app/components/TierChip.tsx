import { tierLabel, type Tier } from "@/lib/overlap";
import { config } from "@/lib/config";

export const TIER_RULES: Record<Tier, string> = {
  green: `Overlap below ${config.greenBelow}%.`,
  amber: `Overlap from ${config.greenBelow}% to ${config.redAbove - 1}%.`,
  red: `Overlap of ${config.redAbove}% or more.`,
};

export function TierChip({ tier, pct, totalWords }: { tier: Tier; pct?: number; totalWords?: number }) {
  if (totalWords === 0) {
    return (
      <span className="chip plain" title="No submitted work is on file, so there is nothing to compare the logged AI outputs against.">
        No submitted work to compare
      </span>
    );
  }
  return (
    <span className={`chip tier-${tier}`} title={`${TIER_RULES[tier]} A reading aid for the grader, not a finding about the student.`}>
      {pct !== undefined && <span>{pct}%</span>}
      {tierLabel(tier)}
    </span>
  );
}
