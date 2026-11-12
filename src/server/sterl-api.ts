// Server-only: this file reads the visitor's session cookie, so it must never reach the browser.
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_ORIGIN } from "@/lib/api-origin";

/**
 * How Server Components and Server Actions talk to the Java API: AS the logged-in customer.
 *
 * The browser's SESSION cookie is forwarded, so the Java API decides whose data this is, exactly as
 * it does for requests from the browser. The website never picks a customer id itself, so it can't
 * show anyone the wrong person's money (BOLA protection lives in one place: the API).
 *
 * Reading cookies() also tells Next this page is personal: it's rendered fresh for every request
 * and never cached or prerendered.
 */
async function sessionCookie(): Promise<string> {
  const session = (await cookies()).get("SESSION")?.value;
  if (!session) redirect("/login");
  return session;
}

export class SterlApiError extends Error {
  readonly status: number;
  /** RFC 9457 problem details from the API: a message safe to show, and per-field messages. */
  readonly detail?: string;
  readonly errors?: Record<string, string>;

  constructor(status: number, problem: { detail?: string; errors?: Record<string, string> } | null) {
    super(`Sterl API answered ${status}`);
    this.name = "SterlApiError";
    this.status = status;
    this.detail = problem?.detail;
    this.errors = problem?.errors;
  }
}

/** GET as the customer. undefined for 404 (not found, or not theirs: the API never says which). */
export async function apiGet<T>(path: string): Promise<T | undefined> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    headers: { Cookie: `SESSION=${await sessionCookie()}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login"); // the session ended (1 hour idle)
  if (res.status === 404) return undefined;
  if (!res.ok) throw new SterlApiError(res.status, null);
  return (await res.json()) as T;
}

/**
 * POST as the customer, with the CSRF token the API requires on every change. The token comes from
 * the API itself (GET /api/auth/csrf) and goes back as both the cookie and the X-XSRF-TOKEN header.
 */
export async function apiPost<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: T }> {
  const session = await sessionCookie();
  const csrf = await fetch(`${API_ORIGIN}/api/auth/csrf`, { headers: { Cookie: `SESSION=${session}` }, cache: "no-store" });
  const token = /XSRF-TOKEN=([^;]+)/.exec(csrf.headers.get("set-cookie") ?? "")?.[1];
  if (!token) throw new SterlApiError(csrf.status, null);

  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      Cookie: `SESSION=${session}; XSRF-TOKEN=${token}`,
      "X-XSRF-TOKEN": decodeURIComponent(token),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new SterlApiError(res.status, json as { detail?: string; errors?: Record<string, string> } | null);
  return { status: res.status, data: json as T };
}
