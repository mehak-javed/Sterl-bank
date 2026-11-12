import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiSend, ApiError } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("talking to the Java API from the browser", () => {
  it("sends the CSRF token with every change", async () => {
    vi.stubGlobal("document", { cookie: "sterl_consent=all; XSRF-TOKEN=abc%3D123" });
    const fetchMock = vi.fn(async (url: string) =>
      url === "/api/auth/csrf" ? new Response(null, { status: 200 }) : Response.json({ id: "c1", frozen: true }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiSend("/api/cards/c1", "PATCH", { frozen: true });

    const [, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("abc=123");
    expect(init.body).toBe('{"frozen":true}');
  });

  it("shows the API's own explanation when it says no (RFC 9457 detail)", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ status: 409, detail: "You already have this card." }, { status: 409 }));
    const error = await apiFetch("/api/cards").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe("You already have this card.");
  });
});
