"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkAssignment, checkSubmission } from "@/app/ai-trace/actions";

/** Runs the LLM reflection check for one submission or for a whole assignment. */
export function CheckButton({ target, id, label, configured }: { target: "submission" | "assignment"; id: number; label: string; configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function run() {
    setMessage("");
    startTransition(async () => {
      const outcome = target === "submission" ? await checkSubmission(id) : await checkAssignment(id);
      setMessage(outcome.message);
      router.refresh();
    });
  }

  return (
    <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="btn primary small" onClick={run} disabled={pending || !configured}>
        {pending ? "Checking…" : label}
      </button>
      <span className="status-line" aria-live="polite">
        {!configured ? "Turned off: add ANTHROPIC_API_KEY to .env.local and restart the server." : message}
      </span>
    </span>
  );
}
