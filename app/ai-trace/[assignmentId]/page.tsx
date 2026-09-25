import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";

export default async function AssignmentEntry({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const viewer = await getViewer();
  redirect(`/ai-trace/${assignmentId}/${viewer.role === "grader" ? "class" : "workspace"}`);
}
