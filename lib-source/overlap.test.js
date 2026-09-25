import { describe, it, expect } from "vitest";
import { computeOverlap, tierFor, tokenize, countWords, TIER_LABELS } from "./overlap.js";

const opts = { n: 6, maxGap: 2 };
const thresholds = { greenBelow: 50, redAbove: 70 };

const aiSentence =
  "The breach began when an attacker reused credentials from an earlier leak to log into the staff portal.";

describe("computeOverlap", () => {
  it("1. returns zero for empty text and no spans", () => {
    const result = computeOverlap("", [{ id: 1, text: aiSentence }], opts);
    expect(result).toEqual({ totalWords: 0, coveredWords: 0, bridgedWords: 0, overlapPct: 0, spans: [] });
  });

  it("2. returns zero when the text is shorter than n words", () => {
    const result = computeOverlap("The breach began when an", [{ id: 1, text: aiSentence }], opts);
    expect(result.totalWords).toBe(5);
    expect(result.overlapPct).toBe(0);
    expect(result.spans).toHaveLength(0);
  });

  it("3. reports 100% for an exact copy", () => {
    const result = computeOverlap(aiSentence, [{ id: 1, text: aiSentence }], opts);
    expect(result.overlapPct).toBe(100);
    expect(result.coveredWords).toBe(result.totalWords);
    expect(result.spans).toHaveLength(1);
    expect(result.spans[0].sourceId).toBe(1);
  });

  it("4. reports 0% when no six-word run is shared", () => {
    const own = "Kōwhai Retail lost customer trust because nobody owned the incident response plan.";
    const result = computeOverlap(own, [{ id: 1, text: aiSentence }], opts);
    expect(result.overlapPct).toBe(0);
    expect(result.spans).toHaveLength(0);
  });

  it("5. ignores case and punctuation when matching", () => {
    const shouted = "THE BREACH BEGAN, WHEN AN ATTACKER REUSED credentials!!";
    const result = computeOverlap(shouted, [{ id: 1, text: aiSentence }], opts);
    expect(result.coveredWords).toBe(8);
    expect(result.overlapPct).toBe(100);
  });

  it("6. counts only the matched words in a mixed text", () => {
    // 6 matched words + 6 own words = 50%
    const mixed = "the breach began when an attacker whereas our own analysis differs entirely";
    const result = computeOverlap(mixed, [{ id: 1, text: aiSentence }], opts);
    expect(result.totalWords).toBe(12);
    expect(result.coveredWords).toBe(6);
    expect(result.overlapPct).toBe(50);
  });

  it("7. bridges a gap of up to maxGap changed words from the same source", () => {
    const edited =
      "The breach began when an attacker exploited old credentials from an earlier leak to log into the staff portal.";
    // "reused" became "exploited old": a two-word gap between two matched runs.
    const result = computeOverlap(edited, [{ id: 1, text: aiSentence }], opts);
    expect(result.spans).toHaveLength(1);
    expect(result.bridgedWords).toBe(2);
    expect(result.coveredWords).toBe(result.totalWords);
  });

  it("8. does not bridge a gap longer than maxGap", () => {
    const edited =
      "The breach began when an attacker took advantage of some very old credentials from an earlier leak to log into the staff portal.";
    const result = computeOverlap(edited, [{ id: 1, text: aiSentence }], opts);
    expect(result.spans).toHaveLength(2);
    expect(result.bridgedWords).toBe(0);
  });

  it("9. does not bridge between runs from different sources", () => {
    const a = "alpha beta gamma delta epsilon zeta";
    const b = "one two three four five six";
    const text = `${a} filler ${b}`;
    const result = computeOverlap(text, [{ id: "a", text: a }, { id: "b", text: b }], opts);
    expect(result.spans.map((s) => s.sourceId)).toEqual(["a", "b"]);
    expect(result.bridgedWords).toBe(0);
    expect(result.coveredWords).toBe(12);
  });

  it("10. span character offsets slice back to the original text", () => {
    const text = `Intro sentence first. ${aiSentence} Then a closing thought of my own.`;
    const result = computeOverlap(text, [{ id: 7, text: aiSentence }], opts);
    expect(result.spans).toHaveLength(1);
    const span = result.spans[0];
    expect(text.slice(span.charStart, span.charEnd)).toBe(aiSentence.replace(/\.$/, ""));
  });

  it("11. attributes shared words to the earliest logged step", () => {
    const result = computeOverlap(aiSentence, [{ id: 1, text: aiSentence }, { id: 2, text: aiSentence }], opts);
    expect(result.spans).toHaveLength(1);
    expect(result.spans[0].sourceId).toBe(1);
  });

  it("12. never mutates its inputs", () => {
    const sources = [{ id: 1, text: aiSentence }];
    const snapshot = JSON.stringify(sources);
    computeOverlap(aiSentence, sources, opts);
    expect(JSON.stringify(sources)).toBe(snapshot);
  });
});

describe("tierFor", () => {
  it("13. maps percentages to tiers at the configured thresholds", () => {
    expect(tierFor(0, thresholds)).toBe("green");
    expect(tierFor(49, thresholds)).toBe("green");
    expect(tierFor(50, thresholds)).toBe("amber");
    expect(tierFor(69, thresholds)).toBe("amber");
    expect(tierFor(70, thresholds)).toBe("red");
    expect(tierFor(100, thresholds)).toBe("red");
  });

  it("14. tier labels use the agreed wording", () => {
    expect(TIER_LABELS.green).toBe("Mostly own wording");
    expect(TIER_LABELS.amber).toBe("Worth a closer read");
    expect(TIER_LABELS.red).toBe("Read the process closely");
  });
});

describe("tokenize", () => {
  it("15. keeps macrons and apostrophes inside words", () => {
    const words = tokenize("Kōwhai Retail's staff didn’t notice.").map((t) => t.word);
    expect(words).toEqual(["kōwhai", "retail's", "staff", "didn't", "notice"]);
    expect(countWords("one two  three")).toBe(3);
  });
});
