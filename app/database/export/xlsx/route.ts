import { getDb } from "@/lib/db";
import { dumpTables, loggedSteps, toWorkbook } from "@/lib/export";
import { getViewer } from "@/lib/viewer";

/** Every table as a sheet in one Excel workbook. Graders only. */
export async function GET() {
  if ((await getViewer()).role !== "grader") return new Response("Exports are for graders.", { status: 403 });
  const db = getDb();
  const file = await toWorkbook(dumpTables(db), loggedSteps(db));
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ai-trace-data.xlsx"',
    },
  });
}
