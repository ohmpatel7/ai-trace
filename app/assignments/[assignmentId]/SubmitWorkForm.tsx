"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitWork } from "@/app/ai-trace/actions";
import { countWords } from "@/lib/overlap";
import { plural } from "@/lib/format";

export function SubmitWorkForm({ assignmentId, steps, expectedMin }: { assignmentId: number; steps: number; expectedMin: number }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  function submit() {
    confirmRef.current?.close();
    startTransition(async () => {
      try {
        await submitWork(assignmentId, text);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <section className="card" aria-labelledby="submit-heading">
      <h2 id="submit-heading">Submit your work</h2>
      <p className="small muted" style={{ margin: "0 0 12px" }}>
        Write your work wherever you normally do. In a real course this is the LMS file upload; in this prototype, paste the finished text so the grader's view can read it.
      </p>
      <label className="field">
        <span className="visually-hidden">Your finished work</span>
        <textarea className="reading" rows={16} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your finished work here." />
      </label>
      <div className="status-line" style={{ margin: "6px 0 12px" }}>{countWords(text)} words.</div>
      {steps < expectedMin && (
        <p className="cue warn">You have logged {plural(steps, "AI step")} in AI Trace; {expectedMin} are expected. You can still submit, but the grader will see the gap, and the log locks once you do.</p>
      )}
      {error && <p className="cue warn" role="alert">{error}</p>}
      <button type="button" className="btn primary" disabled={pending || !text.trim()} onClick={() => confirmRef.current?.showModal()}>
        Submit
      </button>
      <dialog ref={confirmRef} aria-labelledby="confirm-heading">
        <form method="dialog" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h2 id="confirm-heading">Submit this work?</h2>
          <p className="small">Once submitted, your work and your AI-use log for this assignment are locked. The grader reads them together.</p>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={() => confirmRef.current?.close()}>Not yet</button>
            <button type="submit" className="btn primary">Submit</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
