import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/Shell";
import { GraderFooter } from "@/app/components/GraderFooter";
import { CritiqueChip } from "@/app/components/CritiqueChip";
import { TierChip } from "@/app/components/TierChip";
import { getViewer } from "@/lib/viewer";
import { getAssignment, listClassRows } from "@/lib/queries";
import { median, CRITIQUE_LABELS, CRITIQUE_RULES, type CritiqueLabel } from "@/lib/critique";
import { formatDateTime, plural } from "@/lib/format";
import { CRITIQUE_CLASS } from "@/app/components/CritiqueChip";
import { ClassTable } from "./ClassTable";
import { CheckButton } from "@/app/components/CheckButton";
import { llmConfigured } from "@/lib/llm-review";

const LABEL_ORDER: CritiqueLabel[] = ["substantive_critique", "thin_critique", "accepted_without_evaluation", "no_critique"];

export default async function ClassViewPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const assignment = getAssignment(Number(assignmentId));
  if (!assignment || assignment.lane !== 2) notFound();
  const viewer = await getViewer();

  if (viewer.role !== "grader") {
    return (
      <>
        <PageHeader title={assignment.title} crumbs={[{ href: "/ai-trace", label: "AI Trace" }]} />
        <div className="card">
          <p>The class view is for graders. You are viewing as a student.</p>
          <p><Link href={`/ai-trace/${assignment.id}/workspace`}>Open your workspace</Link> or switch to the grader with View as.</p>
        </div>
      </>
    );
  }

  const rows = listClassRows(assignment.id, viewer.id);
  const submitted = rows.filter((r) => r.analysis);
  const stepCounts = submitted.map((r) => r.stepCount);
  const medianSteps = median(stepCounts);
  const tierCounts = { green: 0, amber: 0, red: 0 };
  const withWork = submitted.filter((r) => r.analysis!.totalWords > 0);
  for (const r of withWork) tierCounts[r.analysis!.tier] += 1;
  const withoutWork = submitted.length - withWork.length;
  const reviewed = submitted.filter((r) => r.review?.reviewed);

  // Critique labels across every logged step in the class, each traceable to its step.
  const labelled: { label: CritiqueLabel; student: string; seq: number; submissionId: number; iterationId: number }[] = [];
  for (const r of submitted) {
    for (const s of r.analysis!.critique.steps) {
      labelled.push({ label: s.label, student: r.student.name, seq: s.seq, submissionId: r.submission!.id, iterationId: s.iterationId });
    }
  }
  const totalSteps = labelled.length;
  const base = `/ai-trace/${assignment.id}/submissions`;

  return (
    <>
      <PageHeader
        title={assignment.title}
        subtitle={`Class view. Lane 2, due ${formatDateTime(assignment.due_at)}. ${assignment.expected_min_iterations} AI steps expected per student.`}
        crumbs={[{ href: "/ai-trace", label: "AI Trace" }]}
      />

      <div className="tiles">
        <details className="tile">
          <summary><strong>{submitted.length} of {rows.length}</strong><span>submissions in</span></summary>
          <div className="expand">
            <ul>
              {rows.map((r) => (
                <li key={r.student.id}>
                  {r.analysis ? <Link href={`${base}/${r.submission!.id}`}>{r.student.name}</Link> : r.student.name}
                  {": "}
                  {r.submission?.status === "submitted" ? `submitted ${formatDateTime(r.submission.submitted_at)}` : r.submission?.status === "in_progress" ? "in progress" : "not started"}
                </li>
              ))}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary>
            <strong>{medianSteps === null ? "–" : medianSteps} of {assignment.expected_min_iterations}</strong>
            <span>median AI steps against the minimum</span>
          </summary>
          <div className="expand">
            <ul>
              {submitted.map((r) => (
                <li key={r.student.id}>
                  <Link href={`${base}/${r.submission!.id}`}>{r.student.name}</Link>: {plural(r.stepCount, "step")}
                  {r.stepCount < assignment.expected_min_iterations ? " (under the minimum)" : ""}
                </li>
              ))}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary>
            <strong>{tierCounts.red} · {tierCounts.amber} · {tierCounts.green}</strong>
            <span>Read the process closely · Worth a closer read · Mostly own wording</span>
          </summary>
          <div className="expand">
            {withoutWork > 0 && <p className="muted" style={{ margin: "0 0 6px" }}>{plural(withoutWork, "submission")} with no submitted work on file, so no tier.</p>}
            <ul>
              {(["red", "amber", "green"] as const).map((tier) =>
                withWork.filter((r) => r.analysis!.tier === tier).map((r) => (
                  <li key={r.student.id}>
                    <Link href={`${base}/${r.submission!.id}`}>{r.student.name}</Link>: <TierChip tier={tier} pct={r.analysis!.overlapPct} />
                  </li>
                )),
              )}
            </ul>
          </div>
        </details>
        <details className="tile">
          <summary><strong>{reviewed.length} of {submitted.length}</strong><span>reviewed by you</span></summary>
          <div className="expand">
            {reviewed.length === 0 ? <p className="muted" style={{ margin: 0 }}>None reviewed yet.</p> : (
              <ul>
                {reviewed.map((r) => (
                  <li key={r.student.id}><Link href={`${base}/${r.submission!.id}`}>{r.student.name}</Link>, {formatDateTime(r.review!.updated_at)}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>

      <section className="card" aria-labelledby="dist-heading" style={{ marginBottom: 20 }}>
        <h2 id="dist-heading">Critique labels across every logged step</h2>
        <p className="small muted" style={{ margin: "0 0 10px" }}>
          {plural(totalSteps, "step")} logged by {submitted.length} submitted students. Open a label to see which steps carry it.
        </p>
        <div className="dist">
          <div className="bar" role="img" aria-label={LABEL_ORDER.map((l) => `${CRITIQUE_LABELS[l]}: ${labelled.filter((x) => x.label === l).length}`).join(", ")}>
            {LABEL_ORDER.map((l) => {
              const n = labelled.filter((x) => x.label === l).length;
              return n > 0 ? <span key={l} className={CRITIQUE_CLASS[l]} style={{ width: `${(n / totalSteps) * 100}%` }} title={`${CRITIQUE_LABELS[l]}: ${n}`} /> : null;
            })}
          </div>
          <div className="legend">
            {LABEL_ORDER.map((l) => {
              const items = labelled.filter((x) => x.label === l);
              return (
                <details key={l}>
                  <summary title={CRITIQUE_RULES[l]}>
                    <CritiqueChip label={l} /> <strong>{items.length}</strong>
                  </summary>
                  <ul>
                    {items.length === 0 && <li className="muted">No steps.</li>}
                    {items.map((x) => (
                      <li key={x.iterationId}>
                        <Link href={`${base}/${x.submissionId}#step-${x.iterationId}`}>{x.student}, step {x.seq}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }} aria-labelledby="llm-class-heading">
        <h2 id="llm-class-heading">LLM reflection check</h2>
        <p className="small" style={{ margin: "0 0 10px" }}>
          {(() => {
            const lookCloser = submitted.filter((r) => (r.llm?.lookCloser ?? 0) > 0).length;
            const notRun = submitted.filter((r) => (r.llm?.checked ?? 0) + (r.llm?.stale ?? 0) === 0).length;
            return `${plural(lookCloser, "submission")} with steps to look closer at. ${notRun} not checked yet.`;
          })()}{" "}
          Claude reads every critique against its AI output and points to the ones that look low-effort. Submissions with steps to look closer at sort to the top.
        </p>
        <CheckButton target="assignment" id={assignment.id} label="Check all submitted work" configured={llmConfigured()} />
      </section>

      <ClassTable rows={rows} base={base} expectedMin={assignment.expected_min_iterations} />
      <GraderFooter />
    </>
  );
}
