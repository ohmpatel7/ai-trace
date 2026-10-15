import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { GraderFooter } from "@/app/components/GraderFooter";
import { SettingsPanel } from "@/app/components/SettingsPanel";
import { CritiqueChip, CRITIQUE_CLASS } from "@/app/components/CritiqueChip";
import { CRITIQUE_LABELS, type CritiqueLabel } from "@/lib/critique";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getReview, getSubmission, getUser, listIterations } from "@/lib/queries";
import { getAnalysis } from "@/lib/analysis";
import { getDb } from "@/lib/db";
import { formatDateTime, plural } from "@/lib/format";
import { config } from "@/lib/config";
import { SubmissionView } from "./SubmissionView";
import { ReviewForm } from "./ReviewForm";
import { checksByStep, listReviews } from "@/lib/llm-review";

const LABEL_ORDER: CritiqueLabel[] = ["substantive_critique", "thin_critique", "accepted_without_evaluation", "no_critique"];

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
  const share = analysis.critique.logged.studentShare;
  const aiPct = share === null ? 0 : 100 - Math.round(share * 100);
  const crumbs = [{ href: "/ai-trace", label: "AI Trace" }, { href: `/ai-trace/${assignment.id}/class`, label: "Class view" }];

  return (
    <>
      <PageHeader title={student.name} subtitle={`${student.upi}. ${assignment.title}. Submitted ${formatDateTime(submission.submitted_at)}.`} crumbs={crumbs} />

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>AI use in this log</h2>
        <p className="small muted" style={{ margin: "0 0 10px" }}>
          {plural(iterations.length, "AI step")} logged. Critique depth {analysis.critique.depth ?? "–"} words.{" "}
          {analysis.totalWords === 0 ? "No previous similar work to compare." : `Overlap ${analysis.overlapPct}%: ${analysis.coveredWords} of ${analysis.totalWords} words match a logged AI output.`}
        </p>
        <div className="dist" style={{ marginBottom: 18 }}>
          <div className="bar" role="img" aria-label={`Flagged as AI ${aiPct}%, student's own words ${100 - aiPct}%`}>
            {aiPct > 0 && <span className="share-ai" style={{ width: `${aiPct}%` }} title={`Flagged as AI: ${analysis.critique.logged.aiWords} words`} />}
            {aiPct < 100 && <span className="share-student" style={{ width: `${100 - aiPct}%` }} title={`Student's own words: ${analysis.critique.logged.studentWords} words`} />}
          </div>
          <div className="legend">
            <span className="chip plain share-ai">Flagged as AI</span> <strong>{aiPct}%</strong>
            <span className="chip plain share-student">Student&apos;s own words</span> <strong>{100 - aiPct}%</strong>
          </div>
        </div>
        <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Critique labels across this student&apos;s steps</h3>
        <div className="dist" style={{ marginBottom: 14 }}>
          <div className="bar" role="img" aria-label={LABEL_ORDER.map((l) => `${CRITIQUE_LABELS[l]}: ${analysis.critique.counts[l]}`).join(", ")}>
            {LABEL_ORDER.map((l) =>
              analysis.critique.counts[l] > 0 ? (
                <span key={l} className={CRITIQUE_CLASS[l]} style={{ width: `${(analysis.critique.counts[l] / Math.max(iterations.length, 1)) * 100}%` }} title={`${CRITIQUE_LABELS[l]}: ${analysis.critique.counts[l]}`} />
              ) : null,
            )}
          </div>
          <div className="legend">
            {LABEL_ORDER.map((l) => (
              <span key={l} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <CritiqueChip label={l} /> <strong>{analysis.critique.counts[l]}</strong>
              </span>
            ))}
          </div>
        </div>
        <p className="small muted" style={{ margin: "0 0 10px" }}>
          Overlap counts runs of {config.n}+ words copied from a logged AI output. Flagged as AI is the share of the words in the log written by the AI. Both measure volume, not quality.
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
