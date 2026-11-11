/**
 * The site's public address, used for absolute links (sitemap, robots.txt, share previews).
 * Set NEXT_PUBLIC_SITE_URL in Vercel if the address changes (e.g. a custom domain).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sterl-bank.vercel.app";

/** The public pages search engines should list. The banking app's pages are personal, so they aren't. */
export const PUBLIC_PATHS = [
  "/",
  "/careers",
  "/help",
  "/security",
  "/security/policy",
  "/recruitment-scams",
  "/login",
  "/signup",
] as const;

/** Areas search engines shouldn't crawl: personal banking pages and internal endpoints. */
export const PRIVATE_PATHS = [
  "/dashboard",
  "/accounts/",
  "/transactions",
  "/payments",
  "/cards",
  "/markets",
  "/credit-risk",
  "/api/",
] as const;
