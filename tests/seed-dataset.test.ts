import { describe, it, expect, beforeAll } from "vitest";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { seedDatabase, students, projects, iterations, actionFor } from "@/lib/seed";
import { getAnalysis } from "@/lib/analysis";
import { critiqueLabel } from "@/lib/critique";

let db: Database.Database;

beforeAll(() => {
  db = openDatabase(":memory:");
  seedDatabase(db);
});

function submissionFor(projectId: string) {
  const project = projects.find((p) => p.project_id === projectId)!;
  return db
    .prepare(
      `SELECT s.id, s.status, s.final_text FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id
       WHERE u.upi = ? AND a.title = ?`,
    )
    .get(project.student_id, project.assignment_title) as { id: number; status: string; final_text: string };
}

describe("seeding from the team dataset", () => {
  it("loads every student, project and iteration", () => {
    expect(db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'student'").get()).toEqual({ c: students.length + 1 }); // plus the blank walkthrough account
    expect(db.prepare("SELECT COUNT(*) c FROM submissions").get()).toEqual({ c: projects.length });
    expect(db.prepare("SELECT COUNT(*) c FROM iterations").get()).toEqual({ c: iterations.length });
    expect(db.prepare("SELECT COUNT(*) c FROM assignments WHERE lane = 2").get()).toEqual({ c: 3 });
  });

  for (const project of projects) {
    it(`${project.project_id} keeps the dataset's step count and logged word counts`, () => {
      const sub = submissionFor(project.project_id);
      expect(sub.status).toBe("submitted");
      expect(sub.final_text).toBe(""); // the dataset excludes the submitted work
      const analysis = getAnalysis(db, sub.id);
      expect(analysis.critique.steps).toHaveLength(project.iteration_count);
      expect(analysis.critique.logged.studentWords).toBe(project.logged_student_words);
      expect(analysis.critique.logged.aiWords).toBe(project.logged_ai_words);
      expect(analysis.critique.logged.studentShare).toBeCloseTo(project.logged_student_share, 6);
    });
  }

  it("labels the dataset's scenario steps the way the dataset intends", () => {
    const rows = db.prepare("SELECT critique, action, scenario_tag FROM iterations").all() as { critique: string; action: string; scenario_tag: string }[];
    for (const row of rows) {
      const label = critiqueLabel(row.critique, row.action as never);
      if (row.scenario_tag === "Missing critique example") expect(label).toBe("no_critique");
      if (row.scenario_tag === "Minimal critique example") expect(["thin_critique", "accepted_without_evaluation"]).toContain(label);
    }
    expect(rows.some((r) => r.scenario_tag === "Missing critique example")).toBe(true);
    expect(rows.some((r) => r.scenario_tag === "Minimal critique example")).toBe(true);
  });

  it("maps the dataset's action sentences to a fixed action and keeps the sentence", () => {
    expect(actionFor("I marked the claim as unverified and removed it from my draft.")).toBe("rejected");
    expect(actionFor("I kept the comparison headings and wrote my own local context paragraph.")).toBe("edited");
    expect(actionFor("I pasted the wording into my working draft.")).toBe("accepted");
    const note = db.prepare("SELECT action_note FROM iterations WHERE action_note LIKE 'No revision%'").get() as { action_note: string };
    expect(note.action_note).toBe("No revision recorded.");
  });

  it("recomputing never changes the student's records", () => {
    const before = JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all());
    for (const project of projects) getAnalysis(db, submissionFor(project.project_id).id);
    expect(JSON.stringify(db.prepare("SELECT * FROM iterations ORDER BY id").all())).toBe(before);
  });
});
