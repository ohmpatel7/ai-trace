/**
 * Loads the team's synthetic dataset (lib-source/dataset.json, converted from
 * ai_trace_synthetic_dataset.xlsx) into a database. Used by `npm run seed`, by
 * the in-app reset action, and by the tests.
 *
 * The dataset holds one project per student and three logged steps per project.
 * It deliberately excludes the submitted work, so final_text is empty for every
 * dataset student. One extra blank account (Oliver Bennett) is added for live
 * walkthroughs; it is not part of the dataset.
 */
import type Database from "better-sqlite3";
import dataset from "../lib-source/dataset.json";
import { recomputeAnalysis } from "./analysis";
import { now } from "./db";
import type { StepAction } from "./critique";

export const grader = { name: "Taylor Brooks", upi: "tbro001" };
export const course = { code: "INFOMGMT 399", name: "Information Management Capstone", semester: "2026 Semester Two" };
export const walkthroughStudent = { name: "Oliver Bennett", upi: "oben742" };

interface DatasetStudent { student_id: string; display_name: string }
interface DatasetProject {
  project_id: string; student_id: string; assignment_title: string; assignment_task: string; submission_status: string;
  iteration_count: number; logged_student_words: number; logged_ai_words: number; logged_student_share: number;
}
interface DatasetIteration {
  iteration_id: string; project_id: string; step_number: number; stage: string; student_prompt: string; ai_output: string;
  student_critique: string; student_revision_or_action: string; logged_student_words: number; logged_ai_words: number;
  review_example: string; logged_at_nz: string;
}

export const students = dataset.students as DatasetStudent[];
export const projects = dataset.projects as DatasetProject[];
export const iterations = dataset.iterations as DatasetIteration[];
export const definitions = dataset.definitions as { field: string; meaning: string }[];

/** The three assignments in the dataset, in the order they first appear, plus one Lane 1 placeholder. */
export const assignmentTitles = [...new Set(projects.map((p) => p.assignment_title))];
const LANE1_TITLE = "Reflective essay on information ethics";
const DUE_AT = "2026-09-26T23:59:00+12:00";

/**
 * The dataset records what the student did as a sentence. The app also stores a
 * fixed action so steps can be counted; the sentence is kept as the note.
 */
export function actionFor(revisionOrAction: string): StepAction {
  const text = revisionOrAction.toLowerCase();
  if (text.includes("removed") || text.includes("unverified")) return "rejected";
  if (text.includes("rewrote") || text.includes("kept") || text.includes("replaced") || text.includes("changed")) return "edited";
  return "accepted"; // pasted in, left for later, or no revision recorded
}

/** "2026-09-10 10:15" in the dataset is a fictional NZ clock time. */
function nzIso(loggedAt: string): string {
  return loggedAt.replace(" ", "T") + ":00+12:00";
}

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
    for (const title of assignmentTitles) {
      const task = projects.find((p) => p.assignment_title === title)!.assignment_task;
      const instructions = `${task} This is a Lane 2 assessment: AI tools are permitted. Log every AI step in AI Trace while you work, including the prompt, the output, your own critique of it, and what you did next. At least three steps are expected.`;
      assignmentIds[title] = Number(insertAssignment.run(courseId, title, 2, instructions, DUE_AT, 3).lastInsertRowid);
    }
    insertAssignment.run(courseId, LANE1_TITLE, 1, "A reflective essay written without AI assistance. AI Trace is not used for Lane 1 assessments.", "2026-08-21T23:59:00+12:00", 0);

    const insertSubmission = db.prepare(
      "INSERT INTO submissions (assignment_id, student_id, final_text, status, updated_at, submitted_at) VALUES (?, ?, '', ?, ?, ?)",
    );
    const insertIteration = db.prepare(
      `INSERT INTO iterations (submission_id, seq, tool_name, prompt, ai_output, critique, action, action_note, stage, scenario_tag, created_at, updated_at)
       VALUES (?, ?, 'AI assistant', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const submissionIds: number[] = [];
    for (const student of students) {
      const studentId = Number(insertUser.run(student.display_name, student.student_id, "student").lastInsertRowid);
      enrol.run(studentId, courseId, "student");
      for (const project of projects.filter((p) => p.student_id === student.student_id)) {
        const steps = iterations.filter((it) => it.project_id === project.project_id).sort((a, b) => a.step_number - b.step_number);
        const lastLogged = steps.length ? nzIso(steps[steps.length - 1].logged_at_nz) : DUE_AT;
        const submitted = project.submission_status.toLowerCase().includes("submitted");
        const submittedAt = submitted ? new Date(new Date(lastLogged).getTime() + 3600_000).toISOString() : null;
        const submissionId = Number(
          insertSubmission.run(assignmentIds[project.assignment_title], studentId, submitted ? "submitted" : "in_progress", submittedAt ?? lastLogged, submittedAt).lastInsertRowid,
        );
        for (const it of steps) {
          const stamp = nzIso(it.logged_at_nz);
          insertIteration.run(
            submissionId, it.step_number, it.student_prompt, it.ai_output, it.student_critique ?? "",
            actionFor(it.student_revision_or_action), it.student_revision_or_action, it.stage, it.review_example, stamp, stamp,
          );
        }
        submissionIds.push(submissionId);
      }
    }

    // Blank account for live walkthroughs. Not part of the dataset.
    const demoId = Number(insertUser.run(walkthroughStudent.name, walkthroughStudent.upi, "student").lastInsertRowid);
    enrol.run(demoId, courseId, "student");

    for (const id of submissionIds) recomputeAnalysis(db, id);

    // One submission already reviewed so the class view's reviewed count is not zero.
    db.prepare("INSERT INTO grader_reviews (submission_id, grader_id, reviewed, note, updated_at) VALUES (?, ?, 1, ?, ?)").run(
      submissionIds[0], graderId, "Checked the unsupported 40% claim was removed and the recommendation rewritten in the student's own words.", now(),
    );
  });
  insert();
}
