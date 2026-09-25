"use client";

import type { OverlapSpan } from "@/lib/overlap";

export interface HighlightSource {
  id: number;
  seq: number;
  colour: number; // 1..6
}

/** Colour slot for a step, cycling through the six highlight colours. */
export function colourForSeq(seq: number): number {
  return ((seq - 1) % 6) + 1;
}

interface Props {
  text: string;
  spans: OverlapSpan[];
  sources: HighlightSource[];
  activeSourceId?: number | null;
  onSelect?: (sourceId: number) => void;
  emptyMessage?: string;
}

/**
 * The student's text with every reused passage marked in the colour of the
 * step it came from. Each mark is a keyboard-reachable control that opens the
 * step's record.
 */
export function HighlightedText({ text, spans, sources, activeSourceId, onSelect, emptyMessage }: Props) {
  if (!text.trim()) return <p className="muted small">{emptyMessage ?? "Nothing written yet."}</p>;
  const byId = new Map(sources.map((s) => [s.id, s]));
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    if (span.charStart > cursor) pieces.push(text.slice(cursor, span.charStart));
    const source = byId.get(span.sourceId);
    const colour = source?.colour ?? 6;
    const seqLabel = source ? `step ${source.seq}` : "a logged step";
    const bridged = span.bridgedWords > 0 ? `, ${span.bridgedWords} of them bridged` : "";
    const select = () => onSelect?.(span.sourceId);
    pieces.push(
      <mark
        key={index}
        className={`hl-${colour}${activeSourceId === span.sourceId ? " active" : ""}`}
        tabIndex={0}
        role="button"
        title={`${span.words} words reused from ${seqLabel}${bridged}. Select to open the step.`}
        aria-label={`${span.words} words reused from ${seqLabel}${bridged}. Open the step.`}
        onClick={select}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select();
          }
        }}
      >
        {text.slice(span.charStart, span.charEnd)}
      </mark>,
    );
    cursor = span.charEnd;
  });
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return (
    <div className="highlighted">
      <p>{pieces}</p>
    </div>
  );
}

export function HighlightLegend({ sources, tools }: { sources: HighlightSource[]; tools: Record<number, string> }) {
  if (sources.length === 0) return null;
  return (
    <div className="legend-row" aria-label="Highlight colours by step">
      {sources.map((s) => (
        <span key={s.id} className="chip plain">
          <span className={`swatch hl-${s.colour}`} aria-hidden="true" />
          Step {s.seq}: {tools[s.id]}
        </span>
      ))}
    </div>
  );
}
