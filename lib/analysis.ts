/**
 * Computes overlap and critique results for a submission and caches them in
 * analysis_results. Reads student records, never writes to them.
 */
import type Database from "better-sqlite3";
import { config } from "./config";
import { computeOverlap, tierFor, type OverlapSpan, type Tier } from "./overlap";
import { summariseCritiques, type CritiqueSummary, type StepAction } from "./critique";
import { now } from "./db";

export interface Analysis {
  submissionId: number;
  computedAt: string;
  config: typeof config;
  overlapPct: number;
  tier: Tier;
  coveredWords: number;
  totalWords: number;
  bridgedWords: number;
  spans: OverlapSpan[];
  critique: CritiqueSummary;
}

interface SubmissionRow { id: number; final_text: string }
interface IterationRow { id: number; seq: number; ai_output: string; critique: string; action: StepAction }
interface AnalysisRow {
  submission_id: number; computed_at: string; config_json: string; overlap_pct: number; tier: Tier;
  covered_words: number; total_words: number; bridged_words: number; spans_json: string; critique_json: string;
}

export function recomputeAnalysis(db: Database.Database, submissionId: number): Analysis {
  const submission = db.prepare("SELECT id, final_text FROM submissions WHERE id = ?").get(submissionId) as SubmissionRow | undefined;
  if (!submission) throw new Error(`Submission ${submissionId} not found`);
  const iterations = db
    .prepare("SELECT id, seq, ai_output, critique, action FROM iterations WHERE submission_id = ? ORDER BY seq")
    .all(submissionId) as IterationRow[];

  const overlap = computeOverlap(
    submission.final_text,
    iterations.map((it) => ({ id: it.id, text: it.ai_output })),
    { n: config.n, maxGap: config.maxGap },
  );
  const tier = tierFor(overlap.overlapPct, { greenBelow: config.greenBelow, redAbove: config.redAbove });
  const critique = summariseCritiques(iterations, config.thinWords);

  const analysis: Analysis = {
    submissionId,
    computedAt: now(),
    config,
    overlapPct: overlap.overlapPct,
    tier,
    coveredWords: overlap.coveredWords,
    totalWords: overlap.totalWords,
    bridgedWords: overlap.bridgedWords,
    spans: overlap.spans,
    critique,
  };

  db.prepare(
    `INSERT INTO analysis_results
       (submission_id, computed_at, config_json, overlap_pct, tier, covered_words, total_words, bridged_words, spans_json, critique_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(submission_id) DO UPDATE SET
       computed_at = excluded.computed_at, config_json = excluded.config_json, overlap_pct = excluded.overlap_pct,
       tier = excluded.tier, covered_words = excluded.covered_words, total_words = excluded.total_words,
       bridged_words = excluded.bridged_words, spans_json = excluded.spans_json, critique_json = excluded.critique_json`,
  ).run(
    submissionId, analysis.computedAt, JSON.stringify(config), analysis.overlapPct, analysis.tier,
    analysis.coveredWords, analysis.totalWords, analysis.bridgedWords, JSON.stringify(analysis.spans), JSON.stringify(analysis.critique),
  );
  return analysis;
}

function rowToAnalysis(row: AnalysisRow): Analysis {
  return {
    submissionId: row.submission_id,
    computedAt: row.computed_at,
    config: JSON.parse(row.config_json),
    overlapPct: row.overlap_pct,
    tier: row.tier,
    coveredWords: row.covered_words,
    totalWords: row.total_words,
    bridgedWords: row.bridged_words,
    spans: JSON.parse(row.spans_json),
    critique: JSON.parse(row.critique_json),
  };
}

/** Cached analysis, recomputed if missing or if the thresholds have changed since it was stored. */
export function getAnalysis(db: Database.Database, submissionId: number): Analysis {
  const row = db.prepare("SELECT * FROM analysis_results WHERE submission_id = ?").get(submissionId) as AnalysisRow | undefined;
  if (row && row.config_json === JSON.stringify(config)) return rowToAnalysis(row);
  return recomputeAnalysis(db, submissionId);
}
