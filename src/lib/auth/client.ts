/*
 * Talks to the Java API's login endpoints (Spring Security, built in Auth story A1).
 *
 * CSRF handshake: GET /api/auth/csrf sets an XSRF-TOKEN cookie; every change (log in, sign up,
 * log out) sends that value back in an X-XSRF-TOKEN header. Another website can make a browser SEND
 * our cookies, but it can't READ them, so it can't copy the token into the header: forged requests
 * are refused.
 *
 * The browser reaches the API on the website's own address (/api/auth/...): from Story 2, Next.js
 * forwards those requests to the Java API, so the login cookie stays first-party and HttpOnly.
 */

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<string, string>> };

const UNAVAILABLE = "We couldn't reach Sterl just now. Please try again in a moment.";

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function csrfToken(): Promise<string | undefined> {
  await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
  const token = readCookie("XSRF-TOKEN");
  return token ? decodeURIComponent(token) : undefined;
}

async function post(path: string, body: unknown): Promise<Response> {
  const token = await csrfToken();
  return fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(token ? { "X-XSRF-TOKEN": token } : {}) },
    body: JSON.stringify(body),
  });
}

/** Problem details (RFC 9457) from the API may name failing fields: { errors: { email: "…" } }. */
async function fieldErrors(res: Response): Promise<Partial<Record<string, string>> | undefined> {
  try {
    const problem = (await res.json()) as { errors?: Record<string, string> };
    return problem.errors;
  } catch {
    return undefined;
  }
}

export async function logIn(input: { email: string; password: string }): Promise<AuthResult> {
  try {
    const res = await post("/api/auth/login", input);
    if (res.ok) return { ok: true };
    // The same message for "no such email" and "wrong password": never reveal which accounts exist.
    if (res.status === 401) return { ok: false, message: "That email and password don't match." };
    if (res.status === 429) return { ok: false, message: "Too many attempts. Please wait a minute and try again." };
    return { ok: false, message: UNAVAILABLE };
  } catch {
    return { ok: false, message: UNAVAILABLE };
  }
}

export async function signUp(input: { firstName: string; lastName: string; email: string; password: string }): Promise<AuthResult> {
  try {
    const res = await post("/api/auth/signup", input);
    if (res.ok) return { ok: true };
    if (res.status === 409) {
      return { ok: false, message: "There's already an account with that email.", fieldErrors: { email: "Log in instead, or use another email" } };
    }
    if (res.status === 400) return { ok: false, message: "Some details need another look.", fieldErrors: await fieldErrors(res) };
    if (res.status === 429) return { ok: false, message: "Too many attempts. Please wait a minute and try again." };
    return { ok: false, message: UNAVAILABLE };
  } catch {
    return { ok: false, message: UNAVAILABLE };
  }
}

/** Who is logged in, or null if nobody (or the API can't be reached). */
export type Me = { userId: string; customerId: string | null; email: string; role: string; firstName: string | null; lastName: string | null };

export async function getMe(): Promise<Me | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
    return res.ok ? ((await res.json()) as Me) : null;
  } catch {
    return null;
  }
}

/** Ends the session on the server (not just in the browser). Needs the CSRF token like any change. */
export async function logOut(): Promise<void> {
  try {
    await post("/api/auth/logout", {});
  } catch {
    // Even if the API can't be reached, the person is sent to the login page; the session then
    // simply expires on its own after an hour.
  }
}
