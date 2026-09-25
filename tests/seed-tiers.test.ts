import { describe, it, expect, beforeAll } from "vitest";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { seedDatabase, seedCases } from "@/lib/seed";
import { getAnalysis } from "@/lib/analysis";

let db: Database.Database;

beforeAll(() => {
  db = openDatabase(":memory:");
  seedDatabase(db);
});

function submissionFor(caseId: string) {
  const c = seedCases.find((x) => x.id === caseId)!;
  return db
    .prepare(
      `SELECT s.id, s.status FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id
       WHERE u.upi = ? AND a.title LIKE 'Assignment 2:%'`,
    )
    .get(c.student.upi) as { id: number; status: string };
}

describe("seeded tiers", () => {
  it("seeds one grader, nine students and both lanes of assignment", () => {
    expect(db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'grader'").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'student'").get()).toEqual({ c: 9 });
    const lanes = db.prepare("SELECT DISTINCT lane FROM assignments ORDER BY lane").all();
    expect(lanes).toEqual([{ lane: 1 }, { lane: 2 }]);
  });

  for (const c of seedCases) {
    it(`${c.id} ${c.student.name} reads as ${c.expectedTier}`, () => {
      const sub = submissionFor(c.id);
      expect(sub.status).toBe(c.status);
      expect(getAnalysis(db, sub.id).tier).toBe(c.expectedTier);
    });
  }

  it("covers every tier", () => {
    const tiers = new Set(db.prepare("SELECT tier FROM analysis_results").all().map((r) => (r as { tier: string }).tier));
    expect(tiers).toEqual(new Set(["green", "amber", "red"]));
  });

  it("covers every critique label", () => {
    const labels = new Set<string>();
    for (const row of db.prepare("SELECT critique_json FROM analysis_results").all() as { critique_json: string }[]) {
      for (const step of JSON.parse(row.critique_json).steps) labels.add(step.label);
    }
    expect(labels).toEqual(new Set(["no_critique", "accepted_without_evaluation", "thin_critique", "substantive_critique"]));
  });

  it("covers every action", () => {
    const actions = db.prepare("SELECT DISTINCT action FROM iterations ORDER BY action").all().map((r) => (r as { action: string }).action);
    expect(actions).toEqual(["accepted", "edited", "rejected", "verified_elsewhere"]);
  });

  it("includes a submission with no steps, one still in progress and one not started", () => {
    expect(getAnalysis(db, submissionFor("S4").id).critique.steps).toHaveLength(0);
    expect(submissionFor("S6").status).toBe("in_progress");
    expect(submissionFor("S9").status).toBe("not_started");
  });

  it("recomputing never changes the student's records", () => {
    const before = JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all());
    const textBefore = db.prepare("SELECT final_text FROM submissions ORDER BY id").all();
    for (const c of seedCases) getAnalysis(db, submissionFor(c.id).id);
    expect(JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all())).toBe(before);
    expect(db.prepare("SELECT final_text FROM submissions ORDER BY id").all()).toEqual(textBefore);
  });
});
