"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Applications", match: (p: string) => p === "/admin" || p.startsWith("/admin/applications") },
  { href: "/admin/requests", label: "Requests", match: (p: string) => p.startsWith("/admin/requests") },
  { href: "/admin/assignments", label: "Assignments", match: (p: string) => p.startsWith("/admin/assignments") },
  { href: "/admin/billing", label: "Billing", match: (p: string) => p.startsWith("/admin/billing") },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-5">
        {items.map((i) => {
          const active = i.match(pathname);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                active ? "border-brand text-brand-dark" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
