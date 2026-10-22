import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getSubmissionFor, listIterations } from "@/lib/queries";
import { formatDateTime, plural } from "@/lib/format";
import { SubmitWorkForm } from "./SubmitWorkForm";

/** Simulated LMS hand-in page. In a real course this would be the LMS's own file upload. */
// The LLM check can take a while for a whole class.
export const maxDuration = 120;

export default async function AssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const assignment = getAssignment(Number(assignmentId));
  if (!assignment) notFound();
  const viewer = await getViewer();
  if (viewer.role === "grader") redirect(assignment.lane === 2 ? `/ai-trace/${assignment.id}/class` : "/assignments");

  const crumbs = [{ href: "/assignments", label: "Assignments" }];
  if (assignment.lane === 1) {
    return (
      <>
        <PageHeader title={assignment.title} subtitle={`Lane 1: no AI. Due ${formatDateTime(assignment.due_at)}.`} crumbs={crumbs} />
        <div className="card"><p>Lane 1 hand-in is a placeholder in this prototype. AI Trace is not used for Lane 1 assessments.</p></div>
      </>
    );
  }

  const submission = getSubmissionFor(assignment.id, viewer.id);
  const steps = submission ? listIterations(submission.id).length : 0;
  const submitted = submission?.status === "submitted";

  return (
    <>
      <PageHeader title={assignment.title} subtitle={`Lane 2: AI permitted. Due ${formatDateTime(assignment.due_at)}.`} crumbs={crumbs} />
      <details className="panel" style={{ marginBottom: 16 }}>
        <summary>Assignment instructions</summary>
        <p className="reading" style={{ margin: "10px 0 4px" }}>{assignment.instructions}</p>
      </details>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>{plural(steps, "AI step")} logged in AI Trace.</strong>{" "}
        {submitted ? (
          <Link href={`/ai-trace/${assignment.id}/workspace`}>View your AI-use log</Link>
        ) : (
          <>
            <Link href={`/ai-trace/${assignment.id}/workspace`}>Log AI use</Link> before you submit; the log saves once your work is in.
          </>
        )}
      </div>
      {submitted ? (
        <div className="card">
          <h2>Submitted {formatDateTime(submission!.submitted_at)}</h2>
          <p className="reading" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{submission!.final_text}</p>
        </div>
      ) : (
        <SubmitWorkForm assignmentId={assignment.id} />
      )}
    </>
  );
}
