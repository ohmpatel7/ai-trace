import Link from "next/link";
import { PageHeader } from "./components/Shell";
import { AssignmentList } from "./components/AssignmentList";
import { getCourse } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export default async function HomePage() {
  const course = getCourse();
  const viewer = await getViewer();
  return (
    <>
      <PageHeader title={`${course.code}: ${course.name}`} subtitle={course.semester} />
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Welcome</h2>
        <p>
          This is a simulated course page. The only working section is <Link href="/ai-trace">AI Trace</Link>, which students use to log AI steps
          while they work and graders use to read how a submission was made.
        </p>
      </div>
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Assignments</h2>
      <AssignmentList viewer={viewer} mode="assignments" />
    </>
  );
}
