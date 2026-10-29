"use client";

import { useEffect, useRef, useState } from "react";
import type { StepInput } from "@/app/ai-trace/actions";
import type { Iteration } from "@/lib/types";
import { CRITIQUE_LABELS, CRITIQUE_RULES, critiqueLabel } from "@/lib/critique";
import { countWords } from "@/lib/overlap";
import { config } from "@/lib/config";

interface Props {
  open: boolean;
  step: Iteration | null;
  busy: boolean;
  /** A save that failed on the server. The form keeps everything typed so the student can retry. */
  error: string | null;
  onCancel: () => void;
  onSave: (input: StepInput) => void;
}

const EMPTY: StepInput = { tool_name: "", prompt: "", ai_output: "", critique: "", action: "edited", action_note: "", stage: "" };

export function StepDialog({ open, step, busy, error, onCancel, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<StepInput>(step ? { ...step } : EMPTY);
  const [missingCritique, setMissingCritique] = useState(false);
  const critiqueRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const words = countWords(form.critique);
  const label = critiqueLabel(form.critique, form.action);
  const cueClass = label === "substantive_critique" ? "good" : "warn";
  const cueText =
    label === "no_critique"
      ? `A critique is required. Say what you checked, what was wrong or right, and why. ${config.thinWords} words or more reads as substantive.`
      : label === "substantive_critique"
        ? `${words} words. ${CRITIQUE_LABELS[label]}.`
        : `${words} words. This reads as "${CRITIQUE_LABELS[label]}": ${CRITIQUE_RULES[label]} Add what you checked or changed.`;

  const set = (key: keyof StepInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <dialog ref={ref} onClose={onCancel} aria-labelledby="step-dialog-heading">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Shown in the form rather than as a browser bubble, so it is visible to everyone, including in screen recordings.
          if (!form.critique.trim()) {
            setMissingCritique(true);
            critiqueRef.current?.focus();
            return;
          }
          onSave(form);
        }}
      >
        <h2 id="step-dialog-heading">{step ? `Edit step ${step.seq}` : "Log an AI step"}</h2>
        <label className="field">
          Tool
          <input type="text" value={form.tool_name} onChange={set("tool_name")} placeholder="ChatGPT, Claude, Copilot…" required />
        </label>
        <label className="field">
          Your prompt
          <textarea className="reading" rows={3} value={form.prompt} onChange={set("prompt")} required />
        </label>
        <label className="field">
          AI output <span className="hint">Paste it as it came back. This is what your draft is compared against.</span>
          <textarea className="reading" rows={6} value={form.ai_output} onChange={set("ai_output")} required />
        </label>
        <label className="field">
          <span>
            Your critique <span className="required-star" aria-hidden="true">*</span>
            <span className="visually-hidden"> (required)</span>
          </span>
          <span className="hint">What did you check, what was wrong or right, and why?</span>
          <textarea ref={critiqueRef} className="reading" rows={4} value={form.critique} onChange={(e) => { setMissingCritique(false); set("critique")(e); }}
            required onInvalid={(e) => { e.preventDefault(); setMissingCritique(true); }} aria-invalid={missingCritique || undefined} aria-describedby={missingCritique ? "critique-error" : undefined}
            style={missingCritique ? { borderColor: "var(--tier-red-line)", boxShadow: "0 0 0 3px var(--tier-red-bg)" } : undefined} />
          {missingCritique && <span id="critique-error" role="alert" className="field-error">Your critique is required. The step was not saved.</span>}
        </label>
        <div className={`cue ${cueClass}`} aria-live="polite">{cueText}</div>
        {error && <p role="alert" className="field-error" style={{ margin: "12px 0 0" }}>{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : step ? "Save changes" : "Log step"}</button>
        </div>
      </form>
    </dialog>
  );
}
