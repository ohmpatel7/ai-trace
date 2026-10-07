"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClassRow } from "@/lib/queries";
import { TierChip } from "@/app/components/TierChip";
import { formatDateTime, plural } from "@/lib/format";

type SortKey = "priority" | "name" | "overlap";
const TIER_RANK = { red: 0, amber: 1, green: 2 };
const STATUS_TEXT = { not_started: "Not started", in_progress: "In progress", submitted: "Submitted" } as const;

export function ClassTable({ rows, base, expectedMin }: { rows: ClassRow[]; base: string; expectedMin: number }) {
  const [query, setQuery] = useState("");
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("priority");

  const visible = rows
    .filter((r) => r.student.name.toLowerCase().includes(query.trim().toLowerCase()) || r.student.upi.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((r) => !unreviewedOnly || !r.review?.reviewed)
    .sort((a, b) => {
      if (sort === "name") return a.student.name.localeCompare(b.student.name);
      // Rows without an analysis (not yet submitted) always sort last.
      if (!a.analysis || !b.analysis) return (a.analysis ? 0 : 1) - (b.analysis ? 0 : 1) || a.student.name.localeCompare(b.student.name);
      if (sort === "overlap") return b.analysis.overlapPct - a.analysis.overlapPct || a.student.name.localeCompare(b.student.name);
      return (
        TIER_RANK[a.analysis.tier] - TIER_RANK[b.analysis.tier] ||
        b.analysis.overlapPct - a.analysis.overlapPct ||
        a.student.name.localeCompare(b.student.name)
      );
    });

  return (
    <section aria-labelledby="table-heading">
      <h2 id="table-heading" style={{ fontSize: 16, margin: "0 0 10px" }}>Submissions</h2>
      <div className="toolbar">
        <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span className="visually-hidden">Search students</span>
          <input type="search" placeholder="Search by name or UPI" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={unreviewedOnly} onChange={(e) => setUnreviewedOnly(e.target.checked)} />
          Not yet reviewed only
        </label>
        <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="priority">Review priority</option>
            <option value="name">Name</option>
            <option value="overlap">Overlap</option>
          </select>
        </label>
        <span className="small muted">{plural(visible.length, "student")} shown</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>AI steps</th>
              <th>Overlap</th>
              <th>Critique depth</th>
              <th>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const status = r.submission?.status ?? "not_started";
              const open = Boolean(r.analysis);
              return (
                <tr key={r.student.id} className={open ? "" : "dimmed"}>
                  <td>
                    {open ? <Link href={`${base}/${r.submission!.id}`}>{r.student.name}</Link> : r.student.name}
                    <div className="small muted">{r.student.upi}</div>
                  </td>
                  <td>
                    {STATUS_TEXT[status]}
                    {status === "submitted" && <div className="small muted">{formatDateTime(r.submission!.submitted_at)}</div>}
                  </td>
                  <td>
                    {r.stepCount}
                    {open && r.stepCount < expectedMin && <span className="small muted"> of {expectedMin}</span>}
                  </td>
                  <td>{open ? <TierChip tier={r.analysis!.tier} pct={r.analysis!.overlapPct} totalWords={r.analysis!.totalWords} /> : <span className="small muted">Not yet submitted</span>}</td>
                  <td>
                    {open ? (r.analysis!.critique.depth === null ? <span className="small muted">No steps</span> : plural(r.analysis!.critique.depth, "word")) : ""}
                  </td>
                  <td>{open ? (r.review?.reviewed ? "Yes" : "Not yet") : ""}</td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="muted">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        Review priority lists "Read the process closely" first, then by overlap. Critique depth is the median word count of a student's critiques. Select a name to open the submission.
      </p>
    </section>
  );
}
