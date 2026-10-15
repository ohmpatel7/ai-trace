import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { GraderFooter } from "@/app/components/GraderFooter";
import { SettingsPanel } from "@/app/components/SettingsPanel";
import { CritiqueChip, CRITIQUE_CLASS } from "@/app/components/CritiqueChip";
import { ACTION_LABELS, CRITIQUE_LABELS, CRITIQUE_RULES, whitespaceWords, type CritiqueLabel } from "@/lib/critique";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getReview, getSubmission, getUser, listIterations } from "@/lib/queries";
import { getAnalysis } from "@/lib/analysis";
import { getDb } from "@/lib/db";
import { formatDateTime, plural } from "@/lib/format";
import { SubmissionView } from "./SubmissionView";
import { ReviewForm } from "./ReviewForm";
import { checksByStep, listReviews, summariseReviews } from "@/lib/llm-review";

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
  const llm = summariseReviews(llmReviews, iterations);
  const llmChecks = checksByStep(llmReviews, iterations);
  const share = analysis.critique.logged.studentShare;
  const aiPct = share === null ? 0 : 100 - Math.round(share * 100);
  const crumbs = [{ href: "/ai-trace", label: "AI Trace" }, { href: `/ai-trace/${assignment.id}/class`, label: "Class view" }];

  return (
    <>
      <PageHeader title={student.name} subtitle={`${student.upi}. ${assignment.title}. Submitted ${formatDateTime(submission.submitted_at)}.`} crumbs={crumbs} />

      <div className="tiles">
        <details className="tile">
          <summary><strong>{aiPct}%</strong><span>flagged as AI</span></summary>
          <div className="expand">
            <p style={{ margin: "0 0 6px" }}>
              {analysis.critique.logged.aiWords} AI words and {analysis.critique.logged.studentWords} student words in the log. It measures volume, not quality.
            </p>
            <ul>
              {iterations.map((it) => (
                <li key={it.id}>
                  <a href={`#step-${it.id}`}>Step {it.seq}</a>: {whitespaceWords(it.ai_output)} AI words, {whitespaceWords(it.prompt) + whitespaceWords(it.critique) + whitespaceWords(it.action_note)} student words
                </li>
              ))}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary><strong>{iterations.length}</strong><span>AI steps logged</span></summary>
          <div className="expand">
            <ul>
              {iterations.map((it) => (
                <li key={it.id}><a href={`#step-${it.id}`}>Step {it.seq}</a>: {it.tool_name}, {ACTION_LABELS[it.action].toLowerCase()}</li>
              ))}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary><strong>{analysis.critique.depth ?? "–"}</strong><span>critique depth (median words per critique)</span></summary>
          <div className="expand">
            <ul>
              {analysis.critique.steps.map((st) => (
                <li key={st.iterationId}><a href={`#step-${st.iterationId}`}>Step {st.seq}</a>: {plural(st.words, "word")}</li>
              ))}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary><strong>{llm.checked + llm.stale === 0 ? "–" : `${llm.lookCloser} of ${llm.total}`}</strong><span>steps to look closer at (LLM check)</span></summary>
          <div className="expand">
            {llm.checked + llm.stale === 0 ? (
              <p style={{ margin: 0 }}>The LLM check has not run on this submission.</p>
            ) : (
              <ul>
                {iterations.filter((it) => llmChecks[it.id]?.current && llmChecks[it.id].verdict === "look_closer").map((it) => (
                  <li key={it.id}><a href={`#step-${it.id}`}>Step {it.seq}</a>: {llmChecks[it.id].reason}</li>
                ))}
                {llm.lookCloser === 0 && <li className="muted">Every critique looks considered.</li>}
              </ul>
            )}
          </div>
        </details>
      </div>

      <section className="card" aria-labelledby="dist-heading" style={{ marginBottom: 20 }}>
        <h2 id="dist-heading">Critique labels across this student&apos;s steps</h2>
        <p className="small muted" style={{ margin: "0 0 10px" }}>
          {plural(iterations.length, "step")} logged.{" "}
          {analysis.totalWords === 0 ? "No previous similar work to compare." : `Overlap ${analysis.overlapPct}%: ${analysis.coveredWords} of ${analysis.totalWords} words match a logged AI output.`}{" "}
          Open a label to see which steps carry it.
        </p>
        <div className="dist">
          <div className="bar" role="img" aria-label={LABEL_ORDER.map((l) => `${CRITIQUE_LABELS[l]}: ${analysis.critique.counts[l]}`).join(", ")}>
            {LABEL_ORDER.map((l) =>
              analysis.critique.counts[l] > 0 ? (
                <span key={l} className={CRITIQUE_CLASS[l]} style={{ width: `${(analysis.critique.counts[l] / Math.max(iterations.length, 1)) * 100}%` }} title={`${CRITIQUE_LABELS[l]}: ${analysis.critique.counts[l]}`} />
              ) : null,
            )}
          </div>
          <div className="legend">
            {LABEL_ORDER.map((l) => {
              const items = analysis.critique.steps.filter((st) => st.label === l);
              return (
                <details key={l}>
                  <summary title={CRITIQUE_RULES[l]}>
                    <CritiqueChip label={l} /> <strong>{items.length}</strong>
                  </summary>
                  <ul>
                    {items.length === 0 && <li className="muted">No steps.</li>}
                    {items.map((st) => (
                      <li key={st.iterationId}><a href={`#step-${st.iterationId}`}>Step {st.seq}</a></li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
          <SettingsPanel />
          <Link href={`/ai-trace/${assignment.id}/submissions/${submission.id}/print`} className="btn small">Export PDF report</Link>
        </div>
      </section>

      <SubmissionView submission={submission} iterations={iterations} analysis={analysis} llmChecks={llmChecks} />

      <section className="card" style={{ marginTop: 20 }} aria-labelledby="review-heading">
        <h2 id="review-heading">Your review</h2>
        <p className="small muted" style={{ margin: "0 0 10px" }}>Private to you. The student does not see this note. {plural(iterations.length, "step")} and the final text are the record; this is your reading of it.</p>
        <ReviewForm submissionId={submission.id} initialNote={review?.note ?? ""} initialReviewed={Boolean(review?.reviewed)} />
      </section>
      <GraderFooter />
    </>
  );
}
