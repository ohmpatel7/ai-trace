import { PageHeader } from "../components/Shell";
import { AssignmentList } from "../components/AssignmentList";
import { GraderFooter } from "../components/GraderFooter";
import { getViewer } from "@/lib/viewer";

export default async function AiTraceLanding() {
  const viewer = await getViewer();
  return (
    <>
      <PageHeader
        title="AI Trace"
        subtitle={
          viewer.role === "student"
            ? "Log each AI step while you work on a Lane 2 assignment. Your work itself is handed in through Assignments as usual. Reusing AI wording is permitted; what is assessed is how critically you used it."
            : "Read how each Lane 2 submission was made: the steps a student logged, their critiques, and where AI wording was reused."
        }
      />
      <AssignmentList viewer={viewer} mode="ai-trace" />
      {viewer.role === "grader" && <GraderFooter />}
    </>
  );
}
