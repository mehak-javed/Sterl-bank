/** Who can log in. Customers bank; staff work the bank's desks. Same values as app_users.role in the API. */
export type Role = "customer" | "risk_officer" | "trader" | "admin";

const CUSTOMERS: readonly Role[] = ["customer"];
const RISK_STAFF: readonly Role[] = ["risk_officer", "admin"];
const EVERYONE: readonly Role[] = ["customer", "risk_officer", "trader", "admin"];

/**
 * The main navigation, in order. One list, so the sidebar, the phone tab bar, the route guard and the
 * tests can't drift apart.
 *
 * - label: shown in the desktop sidebar
 * - short: shown under the icon in the phone tab bar (space for about 8 characters)
 * - inTabBar: the 4 places customers use most get a tab on phones; the rest live under "More"
 * - roles: who may open it. Customers never see the risk desk; risk staff never see customers' banking.
 *   (The menu only hides links; the real gatekeepers are the route guard and, above all, the Java API.)
 */
export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", inTabBar: true, roles: CUSTOMERS },
  { href: "/transactions", label: "Transactions", short: "Activity", inTabBar: true, roles: CUSTOMERS },
  { href: "/payments", label: "Payments", short: "Pay", inTabBar: true, roles: CUSTOMERS },
  { href: "/cards", label: "Cards", short: "Cards", inTabBar: true, roles: CUSTOMERS },
  { href: "/credit-risk", label: "Credit risk", short: "Risk", inTabBar: false, roles: RISK_STAFF },
  { href: "/markets", label: "Markets", short: "Markets", inTabBar: false, roles: EVERYONE },
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

/** The links this person may use (none until we know who they are, so nothing wrong flashes up). */
export function navLinksFor(role: string | undefined): NavLink[] {
  return NAV_LINKS.filter((link) => role !== undefined && (link.roles as readonly string[]).includes(role));
}

/** Phone tab bar: customers' 4 everyday tabs; staff have few links, so all of theirs. */
export function tabBarLinksFor(role: string | undefined): NavLink[] {
  const links = navLinksFor(role);
  const tabs = links.filter((link) => link.inTabBar);
  return tabs.length > 0 ? tabs : links;
}

/** Everything that isn't a tab goes under "More" on phones. */
export function moreLinksFor(role: string | undefined): NavLink[] {
  const tabs = tabBarLinksFor(role);
  return navLinksFor(role).filter((link) => !tabs.includes(link));
}
