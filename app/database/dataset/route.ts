import fs from "node:fs";
import path from "node:path";
import { getViewer } from "@/lib/viewer";

/** Serves the team's original synthetic dataset spreadsheet. Graders only. */
export async function GET() {
  const viewer = await getViewer();
  if (viewer.role !== "grader") return new Response("The dataset download is for graders.", { status: 403 });
  const file = fs.readFileSync(path.join(process.cwd(), "lib-source", "ai_trace_synthetic_dataset.xlsx"));
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ai_trace_synthetic_dataset.xlsx"',
    },
  });
}
