"use server";

import { runReadOnlyQuery, type QueryResult } from "@/lib/export";
import { getViewer } from "@/lib/viewer";

export async function runQuery(sql: string): Promise<{ ok: true; result: QueryResult } | { ok: false; message: string }> {
  if ((await getViewer()).role !== "grader") return { ok: false, message: "The query runner is for graders." };
  if (!sql.trim()) return { ok: false, message: "Type a query first." };
  try {
    return { ok: true, result: runReadOnlyQuery(sql) };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
