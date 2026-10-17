import { getDb } from "@/lib/db";
import { getViewer } from "@/lib/viewer";

/** A copy of the SQLite database file itself, including the latest saved changes. Graders only. */
export async function GET() {
  if ((await getViewer()).role !== "grader") return new Response("Exports are for graders.", { status: 403 });
  return new Response(new Uint8Array(getDb().serialize()), {
    headers: { "Content-Type": "application/vnd.sqlite3", "Content-Disposition": 'attachment; filename="ai-trace.db"' },
  });
}
