import fs from "node:fs";
import path from "node:path";

/** Serves the team's original synthetic dataset spreadsheet. */
export function GET() {
  const file = fs.readFileSync(path.join(process.cwd(), "lib-source", "ai_trace_synthetic_dataset.xlsx"));
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ai_trace_synthetic_dataset.xlsx"',
    },
  });
}
