"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReview } from "@/app/ai-trace/actions";

export function ReviewForm({ submissionId, initialNote, initialReviewed }: { submissionId: number; initialNote: string; initialReviewed: boolean }) {
  const [note, setNote] = useState(initialNote);
  const [reviewed, setReviewed] = useState(initialReviewed);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(nextReviewed = reviewed) {
    startTransition(async () => {
      await saveReview(submissionId, note, nextReviewed);
      setStatus("Saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: "grid", gap: 12 }}>
      <label className="field">
        Grader note
        <textarea className="reading" rows={4} value={note} onChange={(e) => { setNote(e.target.value); setStatus(""); }} placeholder="Your reading of the process. Private." />
      </label>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <label className="check">
          <input type="checkbox" checked={reviewed} onChange={(e) => { setReviewed(e.target.checked); save(e.target.checked); }} />
          Mark as reviewed
        </label>
        <button type="submit" className="btn small" disabled={pending}>{pending ? "Saving…" : "Save note"}</button>
        <span className="status-line" aria-live="polite">{status}</span>
      </div>
    </form>
  );
}
