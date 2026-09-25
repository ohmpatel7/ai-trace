/**
 * AI Trace overlap calculation.
 *
 * Pure word matching, no models, no network. Given a student's final text and
 * the AI outputs they logged, it finds every run of `n` consecutive words that
 * also appears in an AI output, joins runs that are separated by at most
 * `maxGap` words the student changed, and reports how much of the final text
 * that covers.
 *
 * Everything here is deterministic and side-effect free: inputs are never
 * mutated and nothing is written anywhere.
 */

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

/**
 * Split text into words, keeping the character range of each so a match can
 * be drawn back onto the original text.
 * @param {string} text
 * @returns {{ word: string, start: number, end: number }[]}
 */
export function tokenize(text) {
  const tokens = [];
  if (!text) return tokens;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const raw = match[0];
    const word = raw.toLowerCase().replace(/’/g, "'").replace(/^[-']+|[-']+$/g, "");
    if (word.length === 0) continue;
    tokens.push({ word, start: match.index, end: match.index + raw.length });
  }
  return tokens;
}

/**
 * Every run of `n` consecutive words in the token list, joined by single spaces.
 */
function nGramKeys(tokens, n) {
  const keys = new Set();
  for (let i = 0; i + n <= tokens.length; i += 1) {
    const parts = [];
    for (let j = 0; j < n; j += 1) parts.push(tokens[i + j].word);
    keys.add(parts.join(" "));
  }
  return keys;
}

/**
 * @typedef {Object} OverlapSpan
 * @property {string|number} sourceId  id of the AI output the words came from
 * @property {number} wordStart  index of the first word (inclusive)
 * @property {number} wordEnd    index of the last word (inclusive)
 * @property {number} charStart  offset into the original text
 * @property {number} charEnd    offset into the original text (exclusive)
 * @property {number} words      words in the span
 * @property {number} bridgedWords  words in the span that were bridged rather than matched
 */

/**
 * @typedef {Object} OverlapResult
 * @property {number} totalWords
 * @property {number} coveredWords  matched plus bridged words
 * @property {number} bridgedWords
 * @property {number} overlapPct    coveredWords / totalWords, rounded to a whole percent
 * @property {OverlapSpan[]} spans
 */

/**
 * @param {string} finalText  the student's final text
 * @param {{ id: string|number, text: string }[]} sources  logged AI outputs, in step order
 * @param {{ n: number, maxGap: number }} options
 * @returns {OverlapResult}
 */
export function computeOverlap(finalText, sources, options) {
  const n = options.n;
  const maxGap = options.maxGap;
  const tokens = tokenize(finalText);
  const totalWords = tokens.length;
  const empty = { totalWords, coveredWords: 0, bridgedWords: 0, overlapPct: 0, spans: [] };
  if (totalWords < n || !sources || sources.length === 0) return empty;

  const sourceKeys = sources
    .filter((source) => source && typeof source.text === "string")
    .map((source) => ({ id: source.id, keys: nGramKeys(tokenize(source.text), n) }));

  // owner[i] is the id of the source that covers word i, or null.
  const owner = new Array(totalWords).fill(null);
  const bridged = new Array(totalWords).fill(false);

  for (let i = 0; i + n <= totalWords; i += 1) {
    const parts = [];
    for (let j = 0; j < n; j += 1) parts.push(tokens[i + j].word);
    const key = parts.join(" ");
    for (const source of sourceKeys) {
      if (!source.keys.has(key)) continue;
      for (let j = i; j < i + n; j += 1) {
        if (owner[j] === null) owner[j] = source.id;
      }
      break; // the earliest logged step that matches gets the words
    }
  }

  // Bridge short gaps between two matched runs from the same source. A gap is
  // one to maxGap consecutive unmatched words.
  if (maxGap > 0) {
    let i = 0;
    while (i < totalWords) {
      if (owner[i] !== null) { i += 1; continue; }
      let gapEnd = i;
      while (gapEnd < totalWords && owner[gapEnd] === null) gapEnd += 1;
      const gapLength = gapEnd - i;
      const before = i > 0 ? owner[i - 1] : null;
      const after = gapEnd < totalWords ? owner[gapEnd] : null;
      if (gapLength <= maxGap && before !== null && before === after) {
        for (let j = i; j < gapEnd; j += 1) {
          owner[j] = before;
          bridged[j] = true;
        }
      }
      i = gapEnd;
    }
  }

  const spans = [];
  let i = 0;
  while (i < totalWords) {
    if (owner[i] === null) { i += 1; continue; }
    const sourceId = owner[i];
    let end = i;
    let bridgedWords = bridged[i] ? 1 : 0;
    while (end + 1 < totalWords && owner[end + 1] === sourceId) {
      end += 1;
      if (bridged[end]) bridgedWords += 1;
    }
    spans.push({
      sourceId,
      wordStart: i,
      wordEnd: end,
      charStart: tokens[i].start,
      charEnd: tokens[end].end,
      words: end - i + 1,
      bridgedWords,
    });
    i = end + 1;
  }

  const coveredWords = owner.filter((id) => id !== null).length;
  const bridgedWords = bridged.filter(Boolean).length;
  const overlapPct = Math.round((coveredWords / totalWords) * 100);
  return { totalWords, coveredWords, bridgedWords, overlapPct, spans };
}

/**
 * Tier is a reading aid for the grader, never a finding about the student.
 * green: below greenBelow. red: redAbove or higher. amber: everything between.
 * @param {number} overlapPct
 * @param {{ greenBelow: number, redAbove: number }} thresholds
 * @returns {'green'|'amber'|'red'}
 */
export function tierFor(overlapPct, thresholds) {
  if (overlapPct < thresholds.greenBelow) return "green";
  if (overlapPct >= thresholds.redAbove) return "red";
  return "amber";
}

export const TIER_LABELS = Object.freeze({
  green: "Mostly own wording",
  amber: "Worth a closer read",
  red: "Read the process closely",
});

/** Word count using the same tokenizer as the overlap calculation. */
export function countWords(text) {
  return tokenize(text).length;
}
