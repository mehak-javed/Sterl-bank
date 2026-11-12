/*
 * Which pages need a login, and where to send people afterwards. Pure functions: easy to test.
 */

/** The personal banking pages. Anything under these needs a logged-in customer. */
export const PROTECTED_PREFIXES = ["/dashboard", "/accounts", "/transactions", "/payments", "/cards", "/markets", "/credit-risk"] as const;

export function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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
