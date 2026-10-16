"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";

export function NavLinks({ isGrader }: { isGrader: boolean }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="nav" aria-label="Course sections">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
      {/* The database view is for graders only. */}
      {isGrader && (
        <Link href="/database" className="about-link" aria-current={isCurrent("/database") ? "page" : undefined}>
          Database
        </Link>
      )}
      <Link
        href="/about"
        className={isGrader ? undefined : "about-link"}
        aria-current={isCurrent("/about") ? "page" : undefined}
        style={isGrader ? { color: "var(--muted)", fontSize: 13 } : undefined}
      >
        About this prototype
      </Link>
    </nav>
  );
}
