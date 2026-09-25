/**
 * Loads the synthetic cases into a database. Used by `npm run seed`, by the
 * in-app reset action, and by the tests.
 */
import type Database from "better-sqlite3";
// @ts-ignore plain JS data module
import { course, grader, assignments, cases } from "../lib-source/synthetic_cases.js";
import { recomputeAnalysis } from "./analysis";
import { now } from "./db";

interface SeedIteration {
  tool_name: string; prompt: string; ai_output: string; critique: string; action: string; action_note: string;
}
interface SeedAssignment {
  key: string; title: string; lane: number; instructions: string; due_at: string; expected_min_iterations: number;
  /** A submission every seeded student (except the blank walkthrough account) gets for this assignment. */
  everyone?: { status: "submitted" | "in_progress"; submitted_at: string | null; final_text: string; iterations: SeedIteration[] };
}
interface SeedCase {
  id: string; title: string; student: { name: string; upi: string }; status: "submitted" | "in_progress" | "not_started";
  submitted_at: string | null; expectedTier: string; final_text: string; iterations: SeedIteration[];
}

export const seedCases = cases as SeedCase[];

export function seedDatabase(db: Database.Database): void {
  const clear = db.transaction(() => {
    for (const table of ["grader_reviews", "analysis_results", "iterations", "submissions", "assignments", "enrolments", "courses", "users"]) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
  });
  clear();

  const insert = db.transaction(() => {
    const courseId = Number(
      db.prepare("INSERT INTO courses (code, name, semester) VALUES (?, ?, ?)").run(course.code, course.name, course.semester).lastInsertRowid,
    );

    const insertUser = db.prepare("INSERT INTO users (name, upi, role) VALUES (?, ?, ?)");
    const enrol = db.prepare("INSERT INTO enrolments (user_id, course_id, role) VALUES (?, ?, ?)");
    const graderId = Number(insertUser.run(grader.name, grader.upi, "grader").lastInsertRowid);
    enrol.run(graderId, courseId, "grader");

    const insertAssignment = db.prepare(
      "INSERT INTO assignments (course_id, title, lane, instructions, due_at, expected_min_iterations) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const assignmentIds: Record<string, number> = {};
    const seedAssignments = assignments as SeedAssignment[];
    for (const a of seedAssignments) {
      assignmentIds[a.key] = Number(
        insertAssignment.run(courseId, a.title, a.lane, a.instructions, a.due_at, a.expected_min_iterations).lastInsertRowid,
      );
    }

    const insertSubmission = db.prepare(
      "INSERT INTO submissions (assignment_id, student_id, final_text, status, updated_at, submitted_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertIteration = db.prepare(
      `INSERT INTO iterations (submission_id, seq, tool_name, prompt, ai_output, critique, action, action_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const allSubmissionIds: number[] = [];
    function addSubmission(assignmentId: number, studentId: number, status: string, submittedAt: string | null, finalText: string, iterations: SeedIteration[]): number {
      const updatedAt = submittedAt ?? "2026-09-23T14:10:00+12:00";
      const submissionId = Number(insertSubmission.run(assignmentId, studentId, finalText, status, updatedAt, submittedAt).lastInsertRowid);
      iterations.forEach((it, index) => {
        // Steps are spaced an hour apart before the submission time so the timeline reads naturally.
        const createdAt = new Date(new Date(updatedAt).getTime() - (iterations.length - index) * 3600_000).toISOString();
        insertIteration.run(submissionId, index + 1, it.tool_name, it.prompt, it.ai_output, it.critique, it.action, it.action_note, createdAt, createdAt);
      });
      allSubmissionIds.push(submissionId);
      return submissionId;
    }

    const submissionIds: Record<string, number> = {};
    for (const c of seedCases) {
      const studentId = Number(insertUser.run(c.student.name, c.student.upi, "student").lastInsertRowid);
      enrol.run(studentId, courseId, "student");
      submissionIds[c.id] = addSubmission(assignmentIds.lane2, studentId, c.status, c.submitted_at, c.final_text, c.iterations);
      if (c.status === "not_started") continue; // the blank walkthrough account has nothing anywhere
      for (const a of seedAssignments) {
        if (a.everyone) addSubmission(assignmentIds[a.key], studentId, a.everyone.status, a.everyone.submitted_at, a.everyone.final_text, a.everyone.iterations);
      }
    }

    for (const submissionId of allSubmissionIds) recomputeAnalysis(db, submissionId);

    // One submission already reviewed so the class view's reviewed count is not zero.
    db.prepare("INSERT INTO grader_reviews (submission_id, grader_id, reviewed, note, updated_at) VALUES (?, ?, 1, ?, ?)").run(
      submissionIds.S3,
      graderId,
      "Strong process. Checked the Privacy Act point independently and rejected the AI's counterargument with a reason.",
      now(),
    );
  });
  insert();
}
