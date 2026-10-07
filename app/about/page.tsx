import { PageHeader } from "../components/Shell";
import { definitions } from "@/lib/seed";

const ROWS: { area: string; state: "Working" | "Simulated" | "Planned"; note: string }[] = [
  { area: "Student AI-use log", state: "Working", note: "Logging and editing AI steps per assignment. Students see their own records only; overlap, tiers and critique labels appear on grader screens." },
  { area: "Handing work in", state: "Simulated", note: "Students write their work wherever they normally do and hand it in through Assignments. Here that is a paste box; in a real course it is the LMS upload, which locks the AI-use log." },
  { area: "Overlap and tiers", state: "Working", note: "Word matching between the draft and logged AI outputs. No AI model is involved and nothing leaves the server." },
  { area: "Critique labels", state: "Working", note: "Plain word-count rules per step, and critique depth as the median across a submission." },
  { area: "Grader class view and submission view", state: "Working", note: "Sorting, search, the reviewed toggle, private notes, highlights that open the step behind them." },
  { area: "Printable summary", state: "Working", note: "A print stylesheet over the same records." },
  { area: "Shared database", state: "Working", note: "SQLite on the server, so every viewer sees the same records. npm run seed or the reset button rebuilds it." },
  { area: "Identity", state: "Simulated", note: "The View as switcher picks a user row. There is no sign-in and no permission model beyond the role on that row." },
  { area: "Course shell", state: "Simulated", note: "The navigation reads as an LMS course page, but only the AI Trace tab does anything." },
  { area: "Student and grader data", state: "Simulated", note: "The team's synthetic dataset: 12 fictional students, 3 assignments, 36 logged steps. It records the AI-use log only, not the submitted work." },
  { area: "LMS integration", state: "Planned", note: "A real deployment would be an LTI 1.3 tool launched from the course, with identity and roles supplied by the LMS." },
  { area: "Multiple courses and assignments", state: "Planned", note: "The schema supports them; the interface shows one course." },
  { area: "Capturing steps automatically", state: "Planned", note: "Students currently paste each step in by hand." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About this prototype" subtitle="INFOMGMT 399, Team 12. What works, what is simulated, and what a real deployment would add." />
      <div className="card">
        <p>
          AI Trace lives inside a course for Lane 2 assessments, where AI use is permitted. Students log each AI step while they work. Graders read
          how a submission was made instead of reading raw chat logs. Every figure on a grader screen opens the record that produced it.
        </p>
        <p>
          The tool supports marking; it does not perform it. Overlap and critique figures only cover AI output the student chose to log and are never
          findings about the student.
        </p>
      </div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="about-table">
          <thead>
            <tr><th>Area</th><th>State</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.area}>
                <td>{r.area}</td>
                <td><span className={`chip ${r.state === "Working" ? "tier-green" : r.state === "Simulated" ? "tier-amber" : ""}`}>{r.state}</span></td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 style={{ fontSize: 18, margin: "24px 0 8px" }}>The dataset</h2>
      <p className="small muted" style={{ margin: "0 0 12px" }}>
        Seeded from ai_trace_synthetic_dataset.xlsx, converted sheet for sheet with no values changed. Its own definitions:
      </p>
      <div className="table-wrap">
        <table className="about-table">
          <thead><tr><th>Field or rule</th><th>Meaning</th></tr></thead>
          <tbody>
            {definitions.map((d) => (
              <tr key={d.field}><td>{d.field}</td><td>{d.meaning}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
