"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDemoData } from "@/app/ai-trace/actions";

export function ResetButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn small"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Reset the demo data? Every change made in this prototype will be replaced by the synthetic seed.")) return;
        startTransition(async () => {
          await resetDemoData();
          router.refresh();
        });
      }}
    >
      {pending ? "Resetting…" : "Reset demo data"}
    </button>
  );
}
