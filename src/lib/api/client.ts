/** An HTTP error from Sterl's API, keeping the status code so callers can decide what to do. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * fetch() only rejects on network failure; a 404 or 503 still "succeeds".
 * This wrapper turns any non-2xx response into a thrown ApiError, which is what
 * TanStack Query needs to notice something went wrong.
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    // The Java API answers with RFC 9457 problem details: "detail" is a message safe to show.
    const message =
      typeof body === "object" && body !== null && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  // `as T` trusts the server's shape. Day 12 adds Zod to check it at runtime instead.
  return body as T;
}

/** The API's CSRF token: fetched fresh (it changes at login), then read from its cookie. */
async function csrfToken(): Promise<string | undefined> {
  await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);
  return raw ? decodeURIComponent(raw) : undefined;
}

/**
 * A change (POST, PATCH…) to the Java API. Adds the CSRF token the API requires on every change, so
 * another website can't make your browser freeze your card or add money.
 */
export async function apiSend<T>(url: string, method: "POST" | "PATCH", body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const token = await csrfToken();
  return apiFetch<T>(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(token ? { "X-XSRF-TOKEN": token } : {}), ...headers },
    body: JSON.stringify(body),
  });
}
