import { notFound } from "next/navigation";
import { PageHeader } from "../components/Shell";
import { NAV_ITEMS } from "../components/nav-items";

export default async function PlaceholderPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((n) => n.href === `/${section}`);
  if (!item || item.href === "/ai-trace" || item.href === "/assignments") notFound();
  return (
    <>
      <PageHeader title={item.label} />
      <div className="card">
        <p>This course section is a placeholder. The prototype only implements the AI Trace tab.</p>
      </div>
    </>
  );
}
