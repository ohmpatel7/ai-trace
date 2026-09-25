import Link from "next/link";
import { listAssignments, getSubmissionFor, listIterations } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { formatDateTime, plural } from "@/lib/format";
import type { User } from "@/lib/types";

/**
 * Every assignment in the course. In "assignments" mode a student's link goes
 * to where they hand work in; in "ai-trace" mode it goes to their AI-use log.
 * Graders always go to the class view.
 */
export function AssignmentList({ viewer, mode }: { viewer: User; mode: "assignments" | "ai-trace" }) {
  const assignments = listAssignments();
  const db = getDb();
  return (
    <div className="assignment-list">
      {assignments.map((a) => {
        if (a.lane === 1) {
          return (
            <div key={a.id} className={`card assignment-row${mode === "ai-trace" ? " lane1" : ""}`}>
              <div>
                <h2>{a.title}</h2>
                <div className="meta">
                  <span>Lane 1: no AI</span>
                  <span>Due {formatDateTime(a.due_at)}</span>
                </div>
              </div>
              <span className="small muted">{mode === "ai-trace" ? "AI Trace is not used for Lane 1 assessments." : "Submitted the usual way. No AI-use log."}</span>
            </div>
          );
        }
        if (viewer.role === "student") {
          const submission = getSubmissionFor(a.id, viewer.id);
          const steps = submission ? listIterations(submission.id).length : 0;
          const submitted = submission?.status === "submitted";
          return (
            <Link key={a.id} href={mode === "ai-trace" ? `/ai-trace/${a.id}/workspace` : `/assignments/${a.id}`} className="card assignment-row">
              <div>
                <h2>{a.title}</h2>
                <div className="meta">
                  <span>Lane 2: AI permitted</span>
                  <span>Due {formatDateTime(a.due_at)}</span>
                  <span className={`chip plain${submitted ? " tier-green" : ""}`}>{submitted ? `Work submitted ${formatDateTime(submission!.submitted_at)}` : "Work not yet submitted"}</span>
                  <span>{plural(steps, "AI step")} logged of {a.expected_min_iterations} expected</span>
                </div>
              </div>
              <span className="btn small">
                {mode === "ai-trace" ? (submitted ? "View AI-use log" : "Log AI use") : submitted ? "View submission" : "Submit work"}
              </span>
            </Link>
          );
        }
        const counts = db.prepare("SELECT status, COUNT(*) c FROM submissions WHERE assignment_id = ? GROUP BY status").all(a.id) as { status: string; c: number }[];
        const submitted = counts.find((c) => c.status === "submitted")?.c ?? 0;
        const inProgress = counts.find((c) => c.status === "in_progress")?.c ?? 0;
        return (
          <Link key={a.id} href={`/ai-trace/${a.id}/class`} className="card assignment-row">
            <div>
              <h2>{a.title}</h2>
              <div className="meta">
                <span>Lane 2: AI permitted</span>
                <span>Due {formatDateTime(a.due_at)}</span>
                <span>{plural(submitted, "submission")} in{inProgress > 0 ? `, ${inProgress} still logging AI use` : ""}</span>
              </div>
            </div>
            <span className="btn small">Open class view</span>
          </Link>
        );
      })}
    </div>
  );
}
