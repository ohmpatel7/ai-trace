import { describe, it, expect, beforeAll, vi } from "vitest";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { runReflectionCheck, summariseReviews, stepHash, type CallModel, type StepForReview } from "@/lib/llm-review";

// These tests never call the real API: a fake model stands in for Claude.
let db: Database.Database;
let submissionId: number;

function stepsFor(id: number): StepForReview[] {
  return db.prepare("SELECT * FROM iterations WHERE submission_id = ? ORDER BY seq").all(id) as StepForReview[];
}

const fakeModel: CallModel = async (steps) => ({
  steps: steps.map((s) => ({
    step: s.seq,
    verdict: s.critique.split(/\s+/).filter(Boolean).length < 6 ? "look_closer" : "considered",
    reason: s.critique ? "Fake reason." : "Critique left blank.",
  })),
});

beforeAll(() => {
  db = openDatabase(":memory:");
  seedDatabase(db);
  // Jade Campbell (JCAM010) has a "Looks fine to me." critique and a "Useful response." critique.
  submissionId = (db.prepare("SELECT s.id FROM submissions s JOIN users u ON u.id = s.student_id WHERE u.upi = 'JCAM010'").get() as { id: number }).id;
});

describe("LLM reflection check", () => {
  it("stores one result per step and summarises the steps to look closer at", async () => {
    const reviews = await runReflectionCheck(db, submissionId, stepsFor(submissionId), fakeModel);
    expect(reviews).toHaveLength(3);
    const summary = summariseReviews(reviews, stepsFor(submissionId));
    expect(summary).toEqual({ checked: 3, lookCloser: 2, stale: 0, total: 3 });
  });

  it("does not call the model again when nothing has changed", async () => {
    const spy = vi.fn(fakeModel);
    await runReflectionCheck(db, submissionId, stepsFor(submissionId), spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it("marks a step stale when it changes, and re-checks only that step", async () => {
    const step = stepsFor(submissionId)[1];
    db.prepare("UPDATE iterations SET critique = ? WHERE id = ?").run("The 40% figure has no source, so I removed it and said the effect is uncertain.", step.id);
    expect(summariseReviews(db.prepare("SELECT * FROM llm_reviews WHERE submission_id = ?").all(submissionId) as never, stepsFor(submissionId)).stale).toBe(1);
    const spy = vi.fn(fakeModel);
    await runReflectionCheck(db, submissionId, stepsFor(submissionId), spy);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].map((s) => s.id)).toEqual([step.id]);
  });

  it("never changes the student's records", async () => {
    const before = JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all());
    db.prepare("DELETE FROM llm_reviews").run();
    await runReflectionCheck(db, submissionId, stepsFor(submissionId), fakeModel);
    expect(JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all())).toBe(before);
  });

  it("a step's hash changes when its content changes and only then", () => {
    const step = stepsFor(submissionId)[0];
    expect(stepHash(step)).toBe(stepHash({ ...step }));
    expect(stepHash(step)).not.toBe(stepHash({ ...step, critique: step.critique + " more" }));
  });
});
