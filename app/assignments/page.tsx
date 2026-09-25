import { PageHeader } from "../components/Shell";
import { AssignmentList } from "../components/AssignmentList";
import { getViewer } from "@/lib/viewer";

export default async function AssignmentsPage() {
  const viewer = await getViewer();
  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle={
          viewer.role === "student"
            ? "Hand your work in here, the same way as any assignment. For Lane 2 assignments, log your AI use in the AI Trace tab while you work."
            : "Every assignment in the course. Lane 2 assignments open in AI Trace."
        }
      />
      <AssignmentList viewer={viewer} mode="assignments" />
    </>
  );
}
