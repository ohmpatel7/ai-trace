import { PageHeader } from "../components/Shell";
import { getDb } from "@/lib/db";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Read-only view of the live database (data/ai-trace.db), so the data behind
 * every screen can be shown without extra tools. Newest rows first, so a step
 * logged a moment ago appears at the top.
 */
const TABLES: { name: string; title: string; about: string; sql: string; open?: boolean }[] = [
  {
    name: "iterations",
    title: "Logged AI steps",
    about: "One row per AI step a student logs: prompt, AI output, critique and what they did next. New steps appear here as soon as they are saved.",
    sql: `SELECT i.id, u.name AS student, a.title AS assignment, i.seq AS step, i.tool_name AS tool, i.prompt, i.ai_output, i.critique, i.action, i.action_note, i.created_at
          FROM iterations i JOIN submissions s ON s.id = i.submission_id JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id
          ORDER BY i.created_at DESC, i.id DESC`,
    open: true,
  },
  {
    name: "submissions",
    title: "Submissions",
    about: "One row per student per assignment: hand-in status and the work handed in.",
    sql: `SELECT s.id, u.name AS student, a.title AS assignment, s.status, s.submitted_at, s.final_text AS work
          FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id ORDER BY s.updated_at DESC`,
  },
  {
    name: "llm_reviews",
    title: "LLM check results",
    about: "Claude's suggestion for each checked step. Stored separately from the student's records.",
    sql: `SELECT r.iteration_id AS step_id, u.name AS student, i.seq AS step, r.verdict, r.reason, r.model, r.checked_at
          FROM llm_reviews r JOIN iterations i ON i.id = r.iteration_id JOIN submissions s ON s.id = r.submission_id JOIN users u ON u.id = s.student_id
          ORDER BY r.checked_at DESC`,
  },
  {
    name: "analysis_results",
    title: "Calculated figures",
    about: "The word-count figures for each submission, recalculated whenever a step or the work changes.",
    sql: `SELECT r.submission_id, u.name AS student, r.overlap_pct, r.tier, r.covered_words, r.total_words, r.computed_at
          FROM analysis_results r JOIN submissions s ON s.id = r.submission_id JOIN users u ON u.id = s.student_id ORDER BY r.computed_at DESC`,
  },
  {
    name: "grader_reviews",
    title: "Grader notes",
    about: "The grader's private notes and reviewed ticks.",
    sql: `SELECT g.submission_id, u.name AS student, g.reviewed, g.note, g.updated_at
          FROM grader_reviews g JOIN submissions s ON s.id = g.submission_id JOIN users u ON u.id = s.student_id ORDER BY g.updated_at DESC`,
  },
  { name: "users", title: "Users", about: "The grader and the students. All fictional.", sql: "SELECT id, name, upi, role FROM users ORDER BY role DESC, name" },
  {
    name: "assignments",
    title: "Assignments",
    about: "The course's assignments. Lane 2 allows AI use; Lane 1 does not.",
    sql: "SELECT id, title, lane, due_at, instructions FROM assignments ORDER BY lane DESC, id",
  },
];

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default async function DatabasePage() {
  const viewer = await getViewer();
  if (viewer.role !== "grader") {
    return (
      <>
        <PageHeader title="Database" />
        <div className="card"><p style={{ margin: 0 }}>The database view is for graders. Switch to the grader with View as.</p></div>
      </>
    );
  }
  const db = getDb();
  return (
    <>
      <PageHeader
        title="Database"
        subtitle="A live, read-only view of the data AI Trace stores. Everything shown is synthetic."
      />
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 8px" }}>
          The app saves everything in one SQLite database file, <code>data/ai-trace.db</code>, on the computer running it. It was loaded from the team&apos;s
          synthetic dataset, and every step logged or note saved since is added to it.
        </p>
        <p style={{ margin: 0 }}>
          <a className="btn small" href="/database/dataset" download>Download the original dataset (.xlsx)</a>
        </p>
      </div>
      {TABLES.map((table) => {
        const rows = db.prepare(table.sql).all() as Record<string, unknown>[];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return (
          <details key={table.name} className="card db-table" open={table.open || undefined}>
            <summary>
              <strong>{table.title}</strong> <span className="muted small">table <code>{table.name}</code>, {rows.length} rows</span>
            </summary>
            <p className="small muted" style={{ margin: "8px 0 10px" }}>{table.about}</p>
            {rows.length === 0 ? (
              <p className="small muted">No rows yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((c) => {
                          const text = cell(row[c]);
                          return <td key={c} title={text.length > 80 ? text : undefined}>{text.length > 80 ? `${text.slice(0, 80)}…` : text}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        );
      })}
    </>
  );
}
