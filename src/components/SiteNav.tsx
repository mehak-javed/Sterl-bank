"use client"; // usePathname reads the browser URL, so this must run in the browser

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/payments", label: "Payments" },
  { href: "/cards", label: "Cards" },
  { href: "/insights", label: "Insights" },
  { href: "/markets", label: "Markets" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      {/* overflow-x-auto: on a phone the links scroll sideways instead of breaking the layout */}
      <ul className="flex gap-1 overflow-x-auto">
        {LINKS.map(({ href, label }) => {
          // "/" would match every URL with startsWith, so the dashboard needs an exact match.
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                // aria-current tells screen readers "you are here". We style from it too,
                // so the look and the accessibility can never disagree.
                aria-current={active ? "page" : undefined}
                className="block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap aria-[current=page]:btn-primary"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
