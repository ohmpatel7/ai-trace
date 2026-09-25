"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn primary small" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
