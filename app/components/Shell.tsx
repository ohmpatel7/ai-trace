import Link from "next/link";
import { getCourse, listUsers } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { ViewAs } from "./ViewAs";
import { ResetButton } from "./ResetButton";
import { NavLinks } from "./NavLinks";

export async function Shell({ children }: { children: React.ReactNode }) {
  const [course, users, viewer] = [getCourse(), listUsers(), await getViewer()];
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Course navigation">
        <div className="course-mark">
          <strong>{course.code}</strong>
          <span>{course.semester}</span>
        </div>
        <NavLinks isGrader={viewer.role === "grader"} />
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="who">
            Viewing as <strong>{viewer.name}</strong> ({viewer.role === "grader" ? "Grader" : "Student"})
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <ViewAs users={users} currentId={viewer.id} />
            <ResetButton />
          </div>
        </header>
        <div className="banner" role="note">
          Synthetic data. Every student, step and figure in this prototype is invented for INFOMGMT 399 and does not describe a real person.
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, crumbs }: { title: string; subtitle?: string; crumbs?: { href: string; label: string }[] }) {
  return (
    <>
      {crumbs && crumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && " / "}
              <Link href={c.href}>{c.label}</Link>
            </span>
          ))}
          {" / "}
          <span>{title}</span>
        </nav>
      )}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </>
  );
}
