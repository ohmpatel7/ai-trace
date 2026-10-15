"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createStep, updateStep, deleteStep, type StepInput, type WorkspaceState } from "@/app/ai-trace/actions";
import type { Assignment, Iteration } from "@/lib/types";
import { ACTION_LABELS } from "@/lib/critique";
import { formatDateTime, plural } from "@/lib/format";
import { StepDialog } from "./StepDialog";

/**
 * The student's AI-use log for one assignment. The work itself is written
 * elsewhere and handed in through Assignments. Overlap, tiers and critique
 * labels are the grader's reading of these records and are not shown here.
 */
export function Workspace({ assignment, initial }: { assignment: Assignment; initial: WorkspaceState }) {
  const [state, setState] = useState(initial);
  const [dialogStep, setDialogStep] = useState<Iteration | null | "new">(null);
  const [pending, startTransition] = useTransition();
  const { submission, iterations } = state;
  const locked = submission.status === "submitted";

  function saveStep(input: StepInput) {
    const editing = dialogStep && dialogStep !== "new" ? dialogStep : null;
    startTransition(async () => {
      const next = editing ? await updateStep(submission.id, editing.id, input) : await createStep(submission.id, input);
      setState(next);
      setDialogStep(null);
    });
  }

  function removeStep(it: Iteration) {
    if (!window.confirm(`Delete step ${it.seq}? The step and its critique will be removed from your log.`)) return;
    startTransition(async () => setState(await deleteStep(submission.id, it.id)));
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <strong>{plural(iterations.length, "step")} logged.</strong>{" "}
            {locked ? (
              <span>Work submitted {formatDateTime(submission.submitted_at)}; this log is saved.</span>
            ) : (
              <span>
                Log a step each time you use an AI tool. Hand your work in through <Link href={`/assignments/${assignment.id}`}>Assignments</Link> as usual; the log saves when you do.
              </span>
            )}
          </div>
          {!locked && (
            <button type="button" className="btn primary" onClick={() => setDialogStep("new")} disabled={pending}>
              Log an AI step
            </button>
          )}
        </div>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Each step records the prompt, the AI output, your critique and what you did next. In this prototype you paste each step in; a real deployment would capture them from the AI tool automatically.
        </p>
      </div>

      <div className="steps">
        {iterations.length === 0 && <p className="muted small">No steps yet. Log one each time you use an AI tool while working on this assignment.</p>}
        {iterations.map((it) => (
          <details key={it.id} id={`step-${it.id}`} className="step">
            <summary>
              <span className="seq">{it.seq}</span>
              <span className="tool">{it.tool_name}</span>
              <span className="chip plain">{ACTION_LABELS[it.action]}</span>
              <span className="spacer" />
              <span className="small muted">{formatDateTime(it.created_at)}</span>
            </summary>
            <div className="body">
              <div><h4>Prompt</h4><p className="reading">{it.prompt}</p></div>
              <div><h4>AI output</h4><p className="reading">{it.ai_output}</p></div>
              <div><h4>Your critique</h4><p className="reading">{it.critique || <span className="muted">No critique recorded.</span>}</p></div>
              <div><h4>What you did next</h4><p className="reading">{ACTION_LABELS[it.action]}{it.action_note ? `. ${it.action_note}` : ""}</p></div>
              {!locked && (
                <div className="actions">
                  <button type="button" className="btn small" onClick={() => setDialogStep(it)} disabled={pending}>Edit</button>
                  <button type="button" className="btn small danger" onClick={() => removeStep(it)} disabled={pending}>Delete</button>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      <StepDialog key={dialogStep === "new" ? "new" : dialogStep?.id ?? "closed"} open={dialogStep !== null} step={dialogStep === "new" ? null : dialogStep}
        onCancel={() => setDialogStep(null)} onSave={saveStep} busy={pending} />
    </>
  );
}
