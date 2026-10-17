import { getDb } from "@/lib/db";
import { toSqlDump } from "@/lib/export";
import { getViewer } from "@/lib/viewer";

/** The schema and every row as a plain SQL file. Graders only. */
export async function GET() {
  if ((await getViewer()).role !== "grader") return new Response("Exports are for graders.", { status: 403 });
  return new Response(toSqlDump(getDb()), {
    headers: { "Content-Type": "application/sql; charset=utf-8", "Content-Disposition": 'attachment; filename="ai-trace-data.sql"' },
  });
}
