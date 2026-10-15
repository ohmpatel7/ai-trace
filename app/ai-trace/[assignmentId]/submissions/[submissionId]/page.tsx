import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { GraderFooter } from "@/app/components/GraderFooter";
import { SettingsPanel } from "@/app/components/SettingsPanel";
import { TierChip } from "@/app/components/TierChip";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getReview, getSubmission, getUser, listIterations } from "@/lib/queries";
import { getAnalysis } from "@/lib/analysis";
import { getDb } from "@/lib/db";
import { formatDateTime, plural } from "@/lib/format";
import { config } from "@/lib/config";
import { SubmissionView } from "./SubmissionView";
import { ReviewForm } from "./ReviewForm";
import { checksByStep, listReviews } from "@/lib/llm-review";

export default async function SubmissionPage({ params }: { params: Promise<{ assignmentId: string; submissionId: string }> }) {
  const { assignmentId, submissionId } = await params;
  const assignment = getAssignment(Number(assignmentId));
  const submission = getSubmission(Number(submissionId));
  if (!assignment || !submission || submission.assignment_id !== assignment.id) notFound();
  const viewer = await getViewer();
  if (viewer.role !== "grader") {
    return (
      <>
        <PageHeader title="Submission" crumbs={[{ href: "/ai-trace", label: "AI Trace" }]} />
        <div className="card"><p>Submission views are for graders. Switch to the grader with View as.</p></div>
      </>
    );
  }
  if (submission.status !== "submitted") {
    return (
      <>
        <PageHeader title="Not yet submitted" crumbs={[{ href: "/ai-trace", label: "AI Trace" }, { href: `/ai-trace/${assignment.id}/class`, label: "Class view" }]} />
        <div className="card"><p>This student has not submitted yet, so there is nothing to review. <Link href={`/ai-trace/${assignment.id}/class`}>Back to the class view</Link>.</p></div>
      </>
    );
  }

  const student = getUser(submission.student_id)!;
  const iterations = listIterations(submission.id);
  const analysis = getAnalysis(getDb(), submission.id);
  const review = getReview(submission.id, viewer.id);
  const llmReviews = listReviews(getDb(), submission.id);
  const crumbs = [{ href: "/ai-trace", label: "AI Trace" }, { href: `/ai-trace/${assignment.id}/class`, label: "Class view" }];

  return (
    <>
      <PageHeader title={student.name} subtitle={`${student.upi}. ${assignment.title}. Submitted ${formatDateTime(submission.submitted_at)}.`} crumbs={crumbs} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stats-row">
          <div className="stat">
            <TierChip tier={analysis.tier} pct={analysis.overlapPct} totalWords={analysis.totalWords} />
            <span>{analysis.totalWords === 0 ? "overlap with logged AI wording" : `${analysis.coveredWords} of ${analysis.totalWords} words match a logged AI output`}</span>
          </div>
          <div className="stat">
            <strong>{analysis.critique.logged.studentShare === null ? "–" : `${Math.round(analysis.critique.logged.studentShare * 100)}%`}</strong>
            <span>logged student share: {analysis.critique.logged.studentWords} student words vs {analysis.critique.logged.aiWords} AI words in the log</span>
          </div>
          <div className="stat">
            <strong>{iterations.length}</strong>
            <span>AI steps logged</span>
          </div>
          <div className="stat">
            <strong>{analysis.critique.depth === null ? "–" : analysis.critique.depth}</strong>
            <span>critique depth (median words per critique)</span>
          </div>
          <div className="stat">
            <strong>{analysis.bridgedWords}</strong>
            <span>bridged words (changed inside a reused passage)</span>
          </div>
        </div>
        <p className="small muted" style={{ margin: "0 0 10px" }}>
          Overlap counts runs of {config.n}+ words copied from a logged AI output. Student share compares the student&apos;s words in the log with the AI&apos;s. Both measure volume, not quality.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SettingsPanel />
          <Link href={`/ai-trace/${assignment.id}/submissions/${submission.id}/print`} className="btn small">Export PDF report</Link>
        </div>
      </div>


      <SubmissionView submission={submission} iterations={iterations} analysis={analysis} llmChecks={checksByStep(llmReviews, iterations)} />

      <section className="card" style={{ marginTop: 20 }} aria-labelledby="review-heading">
        <h2 id="review-heading">Your review</h2>
        <p className="small muted" style={{ margin: "0 0 10px" }}>Private to you. The student does not see this note. {plural(iterations.length, "step")} and the final text are the record; this is your reading of it.</p>
        <ReviewForm submissionId={submission.id} initialNote={review?.note ?? ""} initialReviewed={Boolean(review?.reviewed)} />
      </section>
      <GraderFooter />
    </>
  );
}
