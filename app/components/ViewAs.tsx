"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setViewer } from "@/app/ai-trace/actions";
import type { User } from "@/lib/types";

export function ViewAs({ users, currentId }: { users: User[]; currentId: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      View as
      <select
        value={currentId}
        disabled={pending}
        aria-label="View as user"
        onChange={(e) => {
          const id = Number(e.target.value);
          startTransition(async () => {
            await setViewer(id);
            router.push("/ai-trace");
            router.refresh();
          });
        }}
      >
        <optgroup label="Grader">
          {users.filter((u) => u.role === "grader").map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </optgroup>
        <optgroup label="Students">
          {users.filter((u) => u.role === "student").map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
