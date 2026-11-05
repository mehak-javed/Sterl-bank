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
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  // `as T` trusts the server's shape. Day 12 adds Zod to check it at runtime instead.
  return body as T;
}
