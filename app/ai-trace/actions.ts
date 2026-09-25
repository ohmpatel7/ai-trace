"use server";

/**
 * Every write the app makes. Each one checks who is acting, writes the record,
 * then recomputes the cached analysis for the submission it touched.
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb, now } from "@/lib/db";
import { recomputeAnalysis } from "@/lib/analysis";
import { seedDatabase } from "@/lib/seed";
import { getViewer, VIEWER_COOKIE } from "@/lib/viewer";
import { getOrCreateSubmission, getSubmission, listIterations } from "@/lib/queries";
import type { StepAction } from "@/lib/critique";
import type { Iteration, Submission } from "@/lib/types";

const ACTIONS: StepAction[] = ["accepted", "edited", "rejected", "verified_elsewhere"];

export async function setViewer(userId: number): Promise<void> {
  const store = await cookies();
  store.set(VIEWER_COOKIE, String(userId), { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function resetDemoData(): Promise<void> {
  seedDatabase(getDb());
  revalidatePath("/", "layout");
}

async function ownEditableSubmission(submissionId: number): Promise<Submission> {
  const viewer = await getViewer();
  const submission = getSubmission(submissionId);
  if (!submission || submission.student_id !== viewer.id) throw new Error("This is not your submission.");
  if (submission.status === "submitted") throw new Error("Your work has been submitted, so the AI-use log for it is locked.");
  return submission;
}

/** What the student's workspace shows: their records only. Overlap and critique analysis are for the grader's views. */
export interface WorkspaceState {
  submission: Submission;
  iterations: Iteration[];
}

function workspaceState(submissionId: number): WorkspaceState {
  return { submission: getSubmission(submissionId)!, iterations: listIterations(submissionId) };
}

export interface StepInput {
  tool_name: string; prompt: string; ai_output: string; critique: string; action: StepAction; action_note: string;
}

function cleanStep(input: StepInput): StepInput {
  if (!ACTIONS.includes(input.action)) throw new Error("Unknown action.");
  if (!input.prompt.trim() || !input.ai_output.trim()) throw new Error("A step needs at least a prompt and the AI output.");
  return {
    tool_name: input.tool_name.trim() || "Unnamed tool",
    prompt: input.prompt.trim(),
    ai_output: input.ai_output.trim(),
    critique: input.critique.trim(),
    action: input.action,
    action_note: input.action_note.trim(),
  };
}

export async function createStep(submissionId: number, input: StepInput): Promise<WorkspaceState> {
  await ownEditableSubmission(submissionId);
  const step = cleanStep(input);
  const db = getDb();
  const seq = (db.prepare("SELECT COALESCE(MAX(seq), 0) + 1 s FROM iterations WHERE submission_id = ?").get(submissionId) as { s: number }).s;
  const stamp = now();
  db.prepare(
    `INSERT INTO iterations (submission_id, seq, tool_name, prompt, ai_output, critique, action, action_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(submissionId, seq, step.tool_name, step.prompt, step.ai_output, step.critique, step.action, step.action_note, stamp, stamp);
  // Logging a step means the assignment is under way, even though the work itself is handed in elsewhere.
  db.prepare("UPDATE submissions SET status = 'in_progress', updated_at = ? WHERE id = ?").run(stamp, submissionId);
  recomputeAnalysis(db, submissionId);
  revalidatePath("/ai-trace");
  return workspaceState(submissionId);
}

export async function updateStep(submissionId: number, iterationId: number, input: StepInput): Promise<WorkspaceState> {
  await ownEditableSubmission(submissionId);
  const step = cleanStep(input);
  const db = getDb();
  db.prepare(
    `UPDATE iterations SET tool_name = ?, prompt = ?, ai_output = ?, critique = ?, action = ?, action_note = ?, updated_at = ?
     WHERE id = ? AND submission_id = ?`,
  ).run(step.tool_name, step.prompt, step.ai_output, step.critique, step.action, step.action_note, now(), iterationId, submissionId);
  recomputeAnalysis(db, submissionId);
  return workspaceState(submissionId);
}

export async function deleteStep(submissionId: number, iterationId: number): Promise<WorkspaceState> {
  await ownEditableSubmission(submissionId);
  const db = getDb();
  const renumber = db.transaction(() => {
    db.prepare("DELETE FROM iterations WHERE id = ? AND submission_id = ?").run(iterationId, submissionId);
    const rest = db.prepare("SELECT id FROM iterations WHERE submission_id = ? ORDER BY seq").all(submissionId) as { id: number }[];
    rest.forEach((row, index) => db.prepare("UPDATE iterations SET seq = ? WHERE id = ?").run(index + 1, row.id));
  });
  renumber();
  recomputeAnalysis(db, submissionId);
  revalidatePath("/ai-trace");
  return workspaceState(submissionId);
}

/**
 * The student's work arrives through the course's Assignments tab, the way any
 * assignment is handed in. Submitting it locks the AI-use log for that assignment.
 */
export async function submitWork(assignmentId: number, finalText: string): Promise<Submission> {
  const viewer = await getViewer();
  if (viewer.role !== "student") throw new Error("Only a student can submit work.");
  if (!finalText.trim()) throw new Error("Paste your work before submitting.");
  const submission = getOrCreateSubmission(assignmentId, viewer.id);
  if (submission.status === "submitted") throw new Error("This assignment has already been submitted.");
  const db = getDb();
  const stamp = now();
  db.prepare("UPDATE submissions SET final_text = ?, status = 'submitted', submitted_at = ?, updated_at = ? WHERE id = ?").run(finalText.trim(), stamp, stamp, submission.id);
  recomputeAnalysis(db, submission.id);
  revalidatePath("/", "layout");
  return getSubmission(submission.id)!;
}

export async function saveReview(submissionId: number, note: string, reviewed: boolean): Promise<void> {
  const viewer = await getViewer();
  if (viewer.role !== "grader") throw new Error("Only a grader can review.");
  getDb()
    .prepare(
      `INSERT INTO grader_reviews (submission_id, grader_id, reviewed, note, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(submission_id, grader_id) DO UPDATE SET reviewed = excluded.reviewed, note = excluded.note, updated_at = excluded.updated_at`,
    )
    .run(submissionId, viewer.id, reviewed ? 1 : 0, note.trim(), now());
  revalidatePath("/ai-trace", "layout");
}
