import Link from "next/link";
import { notFound } from "next/navigation";
import { GraderFooter } from "@/app/components/GraderFooter";
import { TierChip, TIER_RULES } from "@/app/components/TierChip";
import { CritiqueChip } from "@/app/components/CritiqueChip";
import { getViewer } from "@/lib/viewer";
import { getAssignment, getReview, getSubmission, getUser, listIterations } from "@/lib/queries";
import { getAnalysis } from "@/lib/analysis";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { config } from "@/lib/config";
import { ACTION_LABELS } from "@/lib/critique";
import { tierLabel } from "@/lib/overlap";
import { PrintButton } from "./PrintButton";

export default async function PrintPage({ params }: { params: Promise<{ assignmentId: string; submissionId: string }> }) {
  const { assignmentId, submissionId } = await params;
  const assignment = getAssignment(Number(assignmentId));
  const submission = getSubmission(Number(submissionId));
  const viewer = await getViewer();
  if (!assignment || !submission || submission.assignment_id !== assignment.id || submission.status !== "submitted") notFound();
  if (viewer.role !== "grader") {
    return <div className="card"><p>Printable summaries are for graders. Switch to the grader with View as.</p></div>;
  }
  const student = getUser(submission.student_id)!;
  const iterations = listIterations(submission.id);
  const analysis = getAnalysis(getDb(), submission.id);
  const review = getReview(submission.id, viewer.id);
  const critiqueBy = new Map(analysis.critique.steps.map((s) => [s.iterationId, s]));
  const reusedBy = new Map<number, number>();
  for (const span of analysis.spans) reusedBy.set(span.sourceId, (reusedBy.get(span.sourceId) ?? 0) + span.words);

  return (
    <div className="print-page">
      <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <Link href={`/ai-trace/${assignment.id}/submissions/${submission.id}`} className="btn small">Back to submission</Link>
        <PrintButton />
      </div>
      <h1 className="page-title">AI Trace summary: {student.name}</h1>
      <p className="page-subtitle">
        {student.upi}. {assignment.title}. Submitted {formatDateTime(submission.submitted_at)}. Prepared for {viewer.name} on {formatDateTime(new Date().toISOString())}. Synthetic data.
      </p>

      <div className="card">
        <div className="stats-row">
          <div className="stat"><TierChip tier={analysis.tier} pct={analysis.overlapPct} /><span>{analysis.coveredWords} of {analysis.totalWords} words match a logged AI output</span></div>
          <div className="stat"><strong>{iterations.length} of {assignment.expected_min_iterations}</strong><span>AI steps logged against the minimum</span></div>
          <div className="stat"><strong>{analysis.critique.depth ?? "–"}</strong><span>critique depth (median words)</span></div>
          <div className="stat"><strong>{analysis.bridgedWords}</strong><span>bridged words</span></div>
        </div>
        <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>What the tier means</h3>
        <p className="small" style={{ margin: 0 }}>
          "{tierLabel(analysis.tier)}": {TIER_RULES[analysis.tier]} A passage counts as reused when {config.n} or more consecutive words match a logged AI output, with up to {config.maxGap} changed words bridged.
          The tier is a reading aid. Reusing AI wording is permitted in Lane 2; the question for marking is how critically the student used it, which the steps below record.
        </p>
      </div>

      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr><th>Step</th><th>Tool and action</th><th>Critique label</th><th>Prompt</th><th>Student's critique</th><th>Words reused</th></tr>
          </thead>
          <tbody>
            {iterations.length === 0 && <tr><td colSpan={6} className="muted">No AI steps were logged.</td></tr>}
            {iterations.map((it) => {
              const crit = critiqueBy.get(it.id)!;
              return (
                <tr key={it.id}>
                  <td>{it.seq}</td>
                  <td>{it.tool_name}<div className="small muted">{ACTION_LABELS[it.action]}{it.action_note ? `. ${it.action_note}` : ""}</div></td>
                  <td><CritiqueChip label={crit.label} words={crit.words} /></td>
                  <td className="reading" style={{ fontSize: 13 }}>{it.prompt}</td>
                  <td className="reading" style={{ fontSize: 13 }}>{it.critique || <span className="muted">No critique recorded.</span>}</td>
                  <td>{reusedBy.get(it.id) ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Grader's note</h3>
        <p className="reading" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{review?.note || <span className="muted">No note recorded.</span>}</p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>{review?.reviewed ? `Marked as reviewed ${formatDateTime(review.updated_at)}.` : "Not yet marked as reviewed."}</p>
      </div>
      <GraderFooter />
    </div>
  );
}
