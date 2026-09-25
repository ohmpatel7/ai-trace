import type { StepAction } from "./critique";

export type Role = "student" | "grader";

export interface User { id: number; name: string; upi: string; role: Role }
export interface Course { id: number; code: string; name: string; semester: string }
export interface Assignment {
  id: number; course_id: number; title: string; lane: 1 | 2; instructions: string; due_at: string; expected_min_iterations: number;
}
export type SubmissionStatus = "not_started" | "in_progress" | "submitted";
export interface Submission {
  id: number; assignment_id: number; student_id: number; final_text: string; status: SubmissionStatus; updated_at: string; submitted_at: string | null;
}
export interface Iteration {
  id: number; submission_id: number; seq: number; tool_name: string; prompt: string; ai_output: string; critique: string;
  action: StepAction; action_note: string; created_at: string; updated_at: string;
}
export interface GraderReview { submission_id: number; grader_id: number; reviewed: number; note: string; updated_at: string }
