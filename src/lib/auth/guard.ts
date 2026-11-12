/*
 * Which pages need a login, and where to send people afterwards. Pure functions: easy to test.
 */

import { NAV_LINKS, type Role } from "@/lib/nav";

/**
 * Every page that needs a login, and WHO may open it: the menu's sections, plus account pages
 * (customers only). Customers never reach the risk desk; risk staff never reach customers' banking.
 */
const AREAS: readonly { prefix: string; roles: readonly string[] }[] = [
  ...NAV_LINKS.map((link) => ({ prefix: link.href, roles: link.roles })),
  { prefix: "/accounts", roles: ["customer"] },
];

export const PROTECTED_PREFIXES = AREAS.map((area) => area.prefix);

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => under(pathname, prefix));
}

/** Where each kind of user starts: their own home page. */
export function homeFor(role: string): string {
  if (role === "risk_officer" || role === "admin") return "/credit-risk";
  if (role === "trader") return "/markets";
  return "/dashboard";
}

/**
 * For a logged-in user: null if they may open this page, otherwise where to send them instead (their
 * own home). A risk officer following a /dashboard link lands on the risk desk, and the other way round.
 */
export function redirectForRole(pathname: string, role: Role | string): string | null {
  const allowed = (path: string) => {
    const area = AREAS.find((a) => under(path, a.prefix));
    return !area || area.roles.includes(role);
  };
  if (allowed(pathname)) return null;
  // Never redirect to a page they can't open either: that would bounce forever. A role with no
  // pages of its own (or one we don't know) goes to the public home page.
  const home = homeFor(role);
  return allowed(home) ? home : "/";
}

/**
 * Where to go after logging in. Only a path on THIS site: "/cards" is fine, but "//evil.example"
 * or "https://evil.example" would turn the login page into an "open redirect" a phishing email
 * could abuse ("log in to Sterl" → lands on a fake site). Anything else goes to the dashboard.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  return next;
}
