"use client";

import { useEffect, useRef, useState } from "react";
import type { StepInput } from "@/app/ai-trace/actions";
import type { Iteration } from "@/lib/types";
import { ACTION_LABELS, CRITIQUE_LABELS, CRITIQUE_RULES, critiqueLabel, type StepAction } from "@/lib/critique";
import { countWords } from "@/lib/overlap";
import { config } from "@/lib/config";

interface Props {
  open: boolean;
  step: Iteration | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: StepInput) => void;
}

const EMPTY: StepInput = { tool_name: "", prompt: "", ai_output: "", critique: "", action: "edited", action_note: "" };

export function StepDialog({ open, step, busy, onCancel, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<StepInput>(step ? { ...step } : EMPTY);

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
      ? `No critique yet. Say what you checked, what was wrong or right, and why you did what you did next. ${config.thinWords} words or more reads as substantive.`
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
          Your critique <span className="hint">What did you check, what was wrong or right, and why?</span>
          <textarea className="reading" rows={4} value={form.critique} onChange={set("critique")} />
        </label>
        <div className={`cue ${cueClass}`} aria-live="polite">{cueText}</div>
        <label className="field">
          What did you do next?
          <select value={form.action} onChange={set("action")}>
            {(Object.keys(ACTION_LABELS) as StepAction[]).map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Note <span className="hint">Optional. For example, what you changed or where you checked it.</span>
          <input type="text" value={form.action_note} onChange={set("action_note")} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : step ? "Save changes" : "Log step"}</button>
        </div>
      </form>
    </dialog>
  );
}
