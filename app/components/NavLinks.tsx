"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";

export function NavLinks() {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="nav" aria-label="Course sections">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
      <Link href="/database" className="about-link" aria-current={isCurrent("/database") ? "page" : undefined}>
        Database
      </Link>
      <Link href="/about" aria-current={isCurrent("/about") ? "page" : undefined} style={{ color: "var(--muted)", fontSize: 13 }}>
        About this prototype
      </Link>
    </nav>
  );
}
