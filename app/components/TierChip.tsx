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
      <span className="chip plain" title="There is no previous similar work on file to compare the logged AI outputs against.">
        No previous similar work to compare
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
