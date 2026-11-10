/**
 * The main navigation, in order. One list, so the sidebar, the phone tab bar and the tests
 * can't drift apart.
 *
 * - label: shown in the desktop sidebar
 * - short: shown under the icon in the phone tab bar (space for about 8 characters)
 * - inTabBar: the 4 places customers use most get a tab on phones; the rest live under "More"
 */
export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", inTabBar: true },
  { href: "/transactions", label: "Transactions", short: "Activity", inTabBar: true },
  { href: "/payments", label: "Payments", short: "Pay", inTabBar: true },
  { href: "/cards", label: "Cards", short: "Cards", inTabBar: true },
  { href: "/credit-risk", label: "Credit risk", short: "Risk", inTabBar: false },
  { href: "/markets", label: "Markets", short: "Markets", inTabBar: false },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

/**
 * Is `href` the current section? Pulled out of the nav as a pure function so it can be
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
