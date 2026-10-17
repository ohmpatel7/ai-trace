"use client";

import { useState, useTransition } from "react";
import { runQuery } from "./actions";
import type { QueryResult } from "@/lib/export";

const EXAMPLES: { label: string; sql: string }[] = [
  {
    label: "Steps per student",
    sql: "SELECT u.name, COUNT(i.id) AS steps\nFROM users u JOIN submissions s ON s.student_id = u.id\nLEFT JOIN iterations i ON i.submission_id = s.id\nGROUP BY u.id ORDER BY steps DESC;",
  },
  {
    label: "Steps the LLM check flagged",
    sql: "SELECT u.name, i.seq AS step, i.critique, r.reason\nFROM llm_reviews r JOIN iterations i ON i.id = r.iteration_id\nJOIN submissions s ON s.id = r.submission_id JOIN users u ON u.id = s.student_id\nWHERE r.verdict = 'look_closer';",
  },
  {
    label: "Empty or short critiques",
    sql: "SELECT u.name, i.seq AS step, i.critique\nFROM iterations i JOIN submissions s ON s.id = i.submission_id JOIN users u ON u.id = s.student_id\nWHERE length(trim(i.critique)) < 30;",
  },
  { label: "Newest logged steps", sql: "SELECT id, submission_id, seq, tool_name, prompt, created_at\nFROM iterations ORDER BY created_at DESC LIMIT 10;" },
];

export function QueryBox() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(text = sql) {
    setError("");
    startTransition(async () => {
      const outcome = await runQuery(text);
      if (outcome.ok) setResult(outcome.result);
      else { setResult(null); setError(outcome.message); }
    });
  }

  return (
    <section className="card" style={{ marginBottom: 16 }} aria-labelledby="query-heading">
      <h2 id="query-heading">Run a SQL query</h2>
      <p className="small muted" style={{ margin: "0 0 10px" }}>
        Read-only: queries run on a read-only connection, and anything that would change data is refused. Up to 500 rows are shown.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {EXAMPLES.map((e) => (
          <button key={e.label} type="button" className="btn small" onClick={() => { setSql(e.sql); run(e.sql); }} disabled={pending}>
            {e.label}
          </button>
        ))}
      </div>
      <label className="field">
        <span className="visually-hidden">SQL query</span>
        <textarea rows={5} value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(); }} />
      </label>
      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "10px 0" }}>
        <button type="button" className="btn primary small" onClick={() => run()} disabled={pending}>{pending ? "Running…" : "Run query"}</button>
        <span className="small muted">or press Cmd+Enter</span>
      </div>
      {error && <p className="cue warn" role="alert">{error}</p>}
      {result && (
        <>
          <p className="small muted" style={{ margin: "0 0 6px" }}>{result.rows.length} row{result.rows.length === 1 ? "" : "s"}{result.truncated ? " (first 500 shown)" : ""}.</p>
          {result.rows.length > 0 && (
            <div className="table-wrap db-table">
              <table>
                <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {result.columns.map((c) => {
                        const text = row[c] === null || row[c] === undefined ? "" : String(row[c]);
                        return <td key={c} title={text.length > 80 ? text : undefined}>{text.length > 80 ? `${text.slice(0, 80)}…` : text}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
