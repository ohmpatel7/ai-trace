"use client";

import { useEffect, useState } from "react";
import type { Iteration, Submission } from "@/lib/types";
import type { Analysis } from "@/lib/analysis";
import { ACTION_LABELS } from "@/lib/critique";
import { formatDateTime } from "@/lib/format";
import { HighlightedText, HighlightLegend, colourForSeq } from "@/app/components/HighlightedText";
import { CritiqueChip } from "@/app/components/CritiqueChip";
import { LlmChip } from "@/app/components/LlmChip";
import type { StepCheck } from "@/lib/llm-labels";

export function SubmissionView({ submission, iterations, analysis, llmChecks }: { submission: Submission; iterations: Iteration[]; analysis: Analysis; llmChecks: Record<number, StepCheck> }) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const sources = iterations.map((it) => ({ id: it.id, seq: it.seq, colour: colourForSeq(it.seq) }));
  const tools = Object.fromEntries(iterations.map((it) => [it.id, it.tool_name]));
  const critiqueBy = new Map(analysis.critique.steps.map((s) => [s.iterationId, s]));
  const wordsBy = new Map<number, number>();
  for (const span of analysis.spans) wordsBy.set(span.sourceId, (wordsBy.get(span.sourceId) ?? 0) + span.words);

  function openStep(id: number) {
    setActiveStep(id);
    const el = document.getElementById(`step-${id}`) as HTMLDetailsElement | null;
    if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.querySelector("summary")?.focus(); }
  }

  // Deep links from the class view arrive as #step-<id>.
  useEffect(() => {
    const match = window.location.hash.match(/^#step-(\d+)$/);
    if (match) openStep(Number(match[1]));
  }, []);

  return (
    <>
      {/* Shown only when work is on file; the team dataset records the AI-use log alone. */}
      {submission.final_text.trim() && (
        <section className="card" style={{ marginBottom: 16 }} aria-labelledby="final-heading">
          <h2 id="final-heading">Submitted work</h2>
          <HighlightedText text={submission.final_text} spans={analysis.spans} sources={sources} activeSourceId={activeStep} onSelect={openStep} />
          <HighlightLegend sources={sources} tools={tools} />
        </section>
      )}
      <section aria-labelledby="record-heading">
        <h2 id="record-heading" style={{ fontSize: 16, margin: "0 0 10px" }}>AI steps as the student logged them</h2>
        {iterations.length === 0 && (
          <div className="card"><p className="muted" style={{ margin: 0 }}>No AI steps were logged. The overlap figure is 0% because there is no logged AI output to compare against, which is not the same as no AI use.</p></div>
        )}
        <div className="steps">
          {iterations.map((it) => {
            const crit = critiqueBy.get(it.id)!;
            const reused = wordsBy.get(it.id) ?? 0;
            return (
              <details key={it.id} id={`step-${it.id}`} className={`step${activeStep === it.id ? " active" : ""}`} open={activeStep === it.id || undefined}>
                <summary>
                  <span className={`seq hl-${colourForSeq(it.seq)}`}>{it.seq}</span>
                  <span className="tool">{it.tool_name}</span>
                  {it.stage && <span className="chip plain">{it.stage}</span>}
                  <span className="chip plain">{ACTION_LABELS[it.action]}</span>
                  <span className="step-row">
                    <CritiqueChip label={crit.label} words={crit.words} />
                    <LlmChip check={llmChecks[it.id]} />
                  </span>
                  <span className="step-row small muted">{reused > 0 ? `${reused} words reused` : "no words reused"}</span>
                </summary>
                <div className="body">
                  <div><h4>Prompt</h4><p className="reading">{it.prompt}</p></div>
                  <div><h4>AI output</h4><p className="reading">{it.ai_output}</p></div>
                  <div><h4>Student's critique</h4><p className="reading">{it.critique || <span className="muted">No critique recorded.</span>}</p></div>
                  <div><h4>What they did next</h4><p className="reading">{ACTION_LABELS[it.action]}{it.action_note ? `. ${it.action_note}` : ""}</p></div>
                  {llmChecks[it.id]?.current && (
                    <div><h4>LLM reflection check (suggestion)</h4><p className="small" style={{ margin: 0 }}>{llmChecks[it.id].reason}</p></div>
                  )}
                  <p className="small muted" style={{ margin: 0 }}>Logged {formatDateTime(it.created_at)}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </>
  );
}
