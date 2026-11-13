/**
 * Headers the website adds when it forwards a browser's /api/* call to the Java API.
 *
 * In production the API only ever sees the website's servers, so on its own it can't tell visitors
 * apart (the login limit would count everyone together). The website therefore passes on the
 * visitor's address, together with a shared secret (STERL_PROXY_SECRET, set on both the website
 * and the API, never in git) that proves the address came from us. Server-side only: the secret is
 * never sent to the browser.
 */
export const SECRET_HEADER = "x-sterl-proxy-secret";
export const CLIENT_IP_HEADER = "x-sterl-client-ip";

/** API areas the website forwards (see next.config.ts rewrites). */
export const FORWARDED_API_AREAS = ["auth", "accounts", "cards", "transfers", "risk", "payees", "payments"] as const;

export function isForwardedApiPath(pathname: string): boolean {
  return FORWARDED_API_AREAS.some((area) => pathname === `/api/${area}` || pathname.startsWith(`/api/${area}/`));
}

/**
 * The request headers to send on to the API. A browser can't smuggle in its own copies: incoming
 * x-sterl-* headers are always removed first. On Vercel, x-forwarded-for is set by Vercel itself
 * (not trusted from the browser), and its first entry is the visitor.
 */
export function forwardedApiHeaders(incoming: Headers, secret: string | undefined): Headers {
  const headers = new Headers(incoming);
  headers.delete(SECRET_HEADER);
  headers.delete(CLIENT_IP_HEADER);
  const visitor = incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip")?.trim();
  const cleanSecret = secret?.trim(); // a value pasted with a line break must still match the API's
  if (cleanSecret && visitor) {
    headers.set(SECRET_HEADER, cleanSecret);
    headers.set(CLIENT_IP_HEADER, visitor);
  }
  return headers;
}
