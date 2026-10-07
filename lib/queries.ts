/**
 * Read queries. Each returns plain rows so pages stay easy to follow.
 */
import { getDb } from "./db";
import { getAnalysis, type Analysis } from "./analysis";
import { listReviews, summariseReviews, type ReviewSummary } from "./llm-review";
import type { Assignment, Course, GraderReview, Iteration, Submission, User } from "./types";

export function listUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY role DESC, name").all() as User[];
}

export function getUser(id: number): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getCourse(): Course {
  return getDb().prepare("SELECT * FROM courses ORDER BY id LIMIT 1").get() as Course;
}

export function listAssignments(): Assignment[] {
  return getDb().prepare("SELECT * FROM assignments ORDER BY due_at").all() as Assignment[];
}

export function getAssignment(id: number): Assignment | undefined {
  return getDb().prepare("SELECT * FROM assignments WHERE id = ?").get(id) as Assignment | undefined;
}

export function getSubmission(id: number): Submission | undefined {
  return getDb().prepare("SELECT * FROM submissions WHERE id = ?").get(id) as Submission | undefined;
}

export function getSubmissionFor(assignmentId: number, studentId: number): Submission | undefined {
  return getDb()
    .prepare("SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?")
    .get(assignmentId, studentId) as Submission | undefined;
}

export function listIterations(submissionId: number): Iteration[] {
  return getDb().prepare("SELECT * FROM iterations WHERE submission_id = ? ORDER BY seq").all(submissionId) as Iteration[];
}

export function getReview(submissionId: number, graderId: number): GraderReview | undefined {
  return getDb()
    .prepare("SELECT * FROM grader_reviews WHERE submission_id = ? AND grader_id = ?")
    .get(submissionId, graderId) as GraderReview | undefined;
}

/** One row per enrolled student for the grader's class view. */
export interface ClassRow {
  student: User;
  submission: Submission | null;
  stepCount: number;
  analysis: Analysis | null;
  review: GraderReview | null;
  llm: ReviewSummary | null;
}

export function listClassRows(assignmentId: number, graderId: number): ClassRow[] {
  const db = getDb();
  const assignment = getAssignment(assignmentId);
  if (!assignment) return [];
  // Students taking this assignment: anyone with a submission row for it (one is created when they open its log).
  const students = db
    .prepare("SELECT u.* FROM users u JOIN submissions s ON s.student_id = u.id WHERE s.assignment_id = ? ORDER BY u.name")
    .all(assignmentId) as User[];
  return students.map((student) => {
    const submission = getSubmissionFor(assignmentId, student.id) ?? null;
    const stepCount = submission
      ? (db.prepare("SELECT COUNT(*) c FROM iterations WHERE submission_id = ?").get(submission.id) as { c: number }).c
      : 0;
    const submitted = submission?.status === "submitted";
    return {
      student,
      submission,
      stepCount,
      analysis: submitted && submission ? getAnalysis(db, submission.id) : null,
      review: submission ? getReview(submission.id, graderId) ?? null : null,
      llm: submitted && submission ? summariseReviews(listReviews(db, submission.id), listIterations(submission.id)) : null,
    };
  });
}

/** A student's submission row for an assignment, created empty on first open. */
export function getOrCreateSubmission(assignmentId: number, studentId: number): Submission {
  const existing = getSubmissionFor(assignmentId, studentId);
  if (existing) return existing;
  const db = getDb();
  const stamp = new Date().toISOString();
  const id = Number(
    db.prepare("INSERT INTO submissions (assignment_id, student_id, final_text, status, updated_at) VALUES (?, ?, '', 'not_started', ?)")
      .run(assignmentId, studentId, stamp).lastInsertRowid,
  );
  getAnalysis(db, id);
  return getSubmission(id)!;
}
