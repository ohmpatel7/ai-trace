/**
 * Typed wrapper around lib/overlap/overlap.js, which is copied unchanged from
 * lib-source/overlap.js. All types here describe what that file returns.
 */
// @ts-ignore plain JS module with JSDoc types
import * as overlapJs from "./overlap.js";
import { config } from "../config";

export type Tier = "green" | "amber" | "red";

export interface OverlapSpan {
  sourceId: number;
  wordStart: number;
  wordEnd: number;
  charStart: number;
  charEnd: number;
  words: number;
  bridgedWords: number;
}

export interface OverlapResult {
  totalWords: number;
  coveredWords: number;
  bridgedWords: number;
  overlapPct: number;
  spans: OverlapSpan[];
}

export interface OverlapSource {
  id: number;
  text: string;
}

export const TIER_LABELS: Record<Tier, string> = overlapJs.TIER_LABELS;

export function computeOverlap(
  finalText: string,
  sources: OverlapSource[],
  options: { n: number; maxGap: number } = { n: config.n, maxGap: config.maxGap },
): OverlapResult {
  return overlapJs.computeOverlap(finalText, sources, options) as OverlapResult;
}

export function tierFor(
  overlapPct: number,
  thresholds: { greenBelow: number; redAbove: number } = { greenBelow: config.greenBelow, redAbove: config.redAbove },
): Tier {
  return overlapJs.tierFor(overlapPct, thresholds) as Tier;
}

export function countWords(text: string): number {
  return overlapJs.countWords(text) as number;
}

export function tierLabel(tier: Tier): string {
  return TIER_LABELS[tier];
}
