"use server";

/**
 * Every write the app makes. Each one checks who is acting, writes the record,
 * then recomputes the cached analysis for the submission it touched.
 */
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb, now } from "@/lib/db";
import { recomputeAnalysis } from "@/lib/analysis";
import { llmConfigured, runReflectionCheck } from "@/lib/llm-review";
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
  tool_name: string; prompt: string; ai_output: string; critique: string; action: StepAction; action_note: string; stage: string;
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
    stage: input.stage.trim(),
  };
}

export async function createStep(submissionId: number, input: StepInput): Promise<WorkspaceState> {
  await ownEditableSubmission(submissionId);
  const step = cleanStep(input);
  const db = getDb();
  const seq = (db.prepare("SELECT COALESCE(MAX(seq), 0) + 1 s FROM iterations WHERE submission_id = ?").get(submissionId) as { s: number }).s;
  const stamp = now();
  db.prepare(
    `INSERT INTO iterations (submission_id, seq, tool_name, prompt, ai_output, critique, action, action_note, stage, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(submissionId, seq, step.tool_name, step.prompt, step.ai_output, step.critique, step.action, step.action_note, step.stage, stamp, stamp);
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
    `UPDATE iterations SET tool_name = ?, prompt = ?, ai_output = ?, critique = ?, action = ?, action_note = ?, stage = ?, updated_at = ?
     WHERE id = ? AND submission_id = ?`,
  ).run(step.tool_name, step.prompt, step.ai_output, step.critique, step.action, step.action_note, step.stage, now(), iterationId, submissionId);
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
  // The reflection check runs as work comes in. A failure here never blocks the hand-in;
  // the grader can run it again from the submission view.
  if (llmConfigured()) {
    try {
      await runReflectionCheck(db, submission.id, listIterations(submission.id));
    } catch (err) {
      console.error("LLM reflection check failed on submit:", (err as Error).message);
    }
  }
  revalidatePath("/", "layout");
  return getSubmission(submission.id)!;
}

export interface CheckOutcome {
  ok: boolean;
  message: string;
}

async function requireGrader() {
  const viewer = await getViewer();
  if (viewer.role !== "grader") throw new Error("Only a grader can run the reflection check.");
}

function describeFailure(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The API key was rejected. Check ANTHROPIC_API_KEY in .env.local.";
  if (err instanceof Anthropic.RateLimitError) return "The API is rate limiting requests. Try again in a minute.";
  if (err instanceof Anthropic.APIConnectionError) return "Could not reach the Anthropic API. Check the internet connection.";
  if (err instanceof Anthropic.APIError) return `The API returned an error (${err.status}).`;
  return (err as Error).message;
}

/** Runs the LLM reflection check on one submission's steps. */
export async function checkSubmission(submissionId: number): Promise<CheckOutcome> {
  await requireGrader();
  if (!llmConfigured()) return { ok: false, message: "Add ANTHROPIC_API_KEY to .env.local and restart the server to turn the check on." };
  const submission = getSubmission(submissionId);
  if (!submission || submission.status !== "submitted") return { ok: false, message: "Only submitted work can be checked." };
  try {
    const reviews = await runReflectionCheck(getDb(), submissionId, listIterations(submissionId));
    revalidatePath("/ai-trace", "layout");
    const lookCloser = reviews.filter((r) => r.verdict === "look_closer").length;
    return { ok: true, message: lookCloser === 0 ? "Checked. Every critique looks considered." : `Checked. ${lookCloser} step${lookCloser === 1 ? "" : "s"} to look closer at.` };
  } catch (err) {
    return { ok: false, message: describeFailure(err) };
  }
}

/** Runs the check on every submitted piece of work for an assignment that has steps without a current result. */
export async function checkAssignment(assignmentId: number): Promise<CheckOutcome> {
  await requireGrader();
  if (!llmConfigured()) return { ok: false, message: "Add ANTHROPIC_API_KEY to .env.local and restart the server to turn the check on." };
  const db = getDb();
  const ids = (db.prepare("SELECT id FROM submissions WHERE assignment_id = ? AND status = 'submitted' ORDER BY id").all(assignmentId) as { id: number }[]).map((r) => r.id);
  let done = 0;
  const failures: string[] = [];
  // Three at a time keeps the class check quick without tripping rate limits.
  for (let i = 0; i < ids.length; i += 3) {
    await Promise.all(
      ids.slice(i, i + 3).map(async (id) => {
        try {
          await runReflectionCheck(db, id, listIterations(id));
          done += 1;
        } catch (err) {
          failures.push(describeFailure(err));
        }
      }),
    );
  }
  revalidatePath("/ai-trace", "layout");
  if (failures.length > 0) return { ok: false, message: `Checked ${done} of ${ids.length}. ${failures[0]}` };
  return { ok: true, message: `Checked ${done} submission${done === 1 ? "" : "s"}.` };
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
