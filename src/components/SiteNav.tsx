"use client"; // usePathname reads the browser URL, so this must run in the browser

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isActivePath } from "@/lib/nav";
import { NavIcon } from "./shell/NavIcon";

/**
 * The main navigation, in two shapes:
 * - "sidebar": every section, icon + full label, stacked (desktop)
 * - "tabbar":  the 4 everyday sections, icon over a short label (phones; the rest are under "More")
 *
 * aria-current="page" marks where you are, for screen readers AND for the styling, so the look
 * and the accessibility can never disagree.
 */
export function SiteNav({ variant }: { variant: "sidebar" | "tabbar" }) {
  const pathname = usePathname();
  const links = variant === "tabbar" ? NAV_LINKS.filter((link) => link.inTabBar) : NAV_LINKS;

  if (variant === "tabbar") {
    return (
      <ul className="grid grid-cols-4">
        {links.map(({ href, short }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActivePath(pathname, href) ? "page" : undefined}
              className="flex flex-col items-center gap-1 py-2 text-[0.7rem] font-medium text-muted aria-[current=page]:text-heading"
            >
              <NavIcon href={href} className="h-5 w-5" />
              {short}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={isActivePath(pathname, href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground aria-[current=page]:btn-primary aria-[current=page]:font-semibold"
          >
            <NavIcon href={href} className="h-[1.15rem] w-[1.15rem]" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
