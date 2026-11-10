/** The main navigation, in order. One list, so the nav and its tests can't drift apart. */
export const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/payments", label: "Payments" },
  { href: "/cards", label: "Cards" },
  { href: "/credit-risk", label: "Credit risk" },
  { href: "/markets", label: "Markets" },
] as const;

/**
 * Is `href` the current section? Pulled out of SiteNav as a pure function so it can be
 * unit-tested without rendering anything.
 *
 * - "/" only matches exactly (every path starts with "/").
 * - Other links match their own page and anything below it: /credit-risk/acme-ltd → Credit risk.
 * - Segment-aware: "/cards" must NOT match "/cardsharp" (a plain startsWith would).
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
