"use client"; // usePathname reads the browser URL, so this must run in the browser

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isActivePath } from "@/lib/nav";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      {/* overflow-x-auto: on a phone the links scroll sideways instead of breaking the layout */}
      <ul className="flex gap-1 overflow-x-auto">
        {NAV_LINKS.map(({ href, label }) => {
          const active = isActivePath(pathname, href); // tested in src/lib/nav.test.ts
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
