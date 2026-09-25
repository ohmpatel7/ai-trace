import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getOrCreateSubmission, listIterations } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { Workspace } from "./Workspace";

export default async function WorkspacePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const assignment = getAssignment(Number(assignmentId));
  if (!assignment || assignment.lane !== 2) notFound();
  const viewer = await getViewer();

  if (viewer.role !== "student") {
    return (
      <>
        <PageHeader title={assignment.title} crumbs={[{ href: "/ai-trace", label: "AI Trace" }]} />
        <div className="card">
          <p>The AI-use log is where a student records their steps. You are viewing as a grader.</p>
          <p><Link href={`/ai-trace/${assignment.id}/class`}>Open the class view</Link> or switch to a student with View as.</p>
        </div>
      </>
    );
  }

  const submission = getOrCreateSubmission(assignment.id, viewer.id);
  const iterations = listIterations(submission.id);

  return (
    <>
      <PageHeader
        title={`AI-use log: ${assignment.title}`}
        subtitle={`Lane 2: AI permitted. Due ${formatDateTime(assignment.due_at)}.`}
        crumbs={[{ href: "/ai-trace", label: "AI Trace" }]}
      />
      <details className="panel" style={{ marginBottom: 16 }}>
        <summary>Assignment instructions</summary>
        <p className="reading" style={{ margin: "10px 0 4px" }}>{assignment.instructions}</p>
      </details>
      <Workspace assignment={assignment} initial={{ submission, iterations }} />
    </>
  );
}
