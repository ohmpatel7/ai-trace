/**
 * Every threshold AI Trace uses, in one place. The grader's submission view
 * prints these so anyone reading a figure can see the rule that produced it.
 */
export const config = {
  /** Words in a run that must match an AI output before it counts as reused. */
  n: 6,
  /** Up to this many changed words between two matched runs are treated as part of the reuse. */
  maxGap: 2,
  /** Overlap below this percentage reads as "Mostly own wording". */
  greenBelow: 50,
  /** Overlap at or above this percentage reads as "Read the process closely". */
  redAbove: 70,
  /** A critique with fewer words than this is a thin critique. */
  thinWords: 15,
  /** Steps a student is expected to log for a Lane 2 assignment. */
  expectedMin: 3,
} as const;

export type Config = typeof config;

/** Human-readable description of each setting, shown next to the figures it shapes. */
export const configDescriptions: { key: keyof Config; label: string; explain: string }[] = [
  { key: "n", label: "Run length", explain: "A passage counts as reused when this many consecutive words also appear in a logged AI output." },
  { key: "maxGap", label: "Bridged gap", explain: "Two reused runs from the same step are joined when at most this many changed words sit between them." },
  { key: "greenBelow", label: "Mostly own wording", explain: "Overlap below this percentage." },
  { key: "redAbove", label: "Read the process closely", explain: "Overlap at or above this percentage. Between the two is Worth a closer read." },
  { key: "thinWords", label: "Thin critique", explain: "A critique with fewer words than this is thin." },
  { key: "expectedMin", label: "Expected steps", explain: "The minimum number of AI steps a student is asked to log." },
];
