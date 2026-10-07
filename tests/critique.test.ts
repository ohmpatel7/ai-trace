import { describe, it, expect } from "vitest";
import { critiqueLabel, summariseCritiques, median } from "@/lib/critique";

const fifteen = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen";

describe("critiqueLabel", () => {
  it("labels an empty critique as no critique recorded", () => {
    expect(critiqueLabel("", "edited")).toBe("no_critique");
    expect(critiqueLabel("   ", "accepted")).toBe("no_critique");
  });
  it("labels a short critique on an accepted step as accepted without evaluation", () => {
    expect(critiqueLabel("Looks good.", "accepted")).toBe("accepted_without_evaluation");
  });
  it("labels a short critique on any other action as thin", () => {
    expect(critiqueLabel("Looks good.", "edited")).toBe("thin_critique");
    expect(critiqueLabel("Looks good.", "rejected")).toBe("thin_critique");
  });
  it("labels fifteen words or more as substantive", () => {
    expect(critiqueLabel(fifteen, "accepted")).toBe("substantive_critique");
  });
});

describe("summariseCritiques", () => {
  it("reports critique depth as the median word count", () => {
    const summary = summariseCritiques([
      { id: 1, seq: 1, prompt: "one two", critique: "", action: "accepted", action_note: "" },
      { id: 2, seq: 2, prompt: "one two", critique: "four words right here", action: "edited", action_note: "done" },
      { id: 3, seq: 3, prompt: "one two", critique: fifteen, action: "edited", action_note: "" },
    ]);
    expect(summary.depth).toBe(4);
    expect(summary.counts).toEqual({ no_critique: 1, accepted_without_evaluation: 0, thin_critique: 1, substantive_critique: 1 });
  });
  it("has no depth when there are no steps", () => {
    expect(summariseCritiques([]).depth).toBeNull();
    expect(median([2, 8])).toBe(5);
  });
});
