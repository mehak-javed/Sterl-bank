import { afterEach, describe, expect, it, vi } from "vitest";
import { getMe, logIn, logOut, logOutAndLeave, signUp } from "./client";
import { loginSchema, passwordStrength, signupSchema } from "./schemas";

const valid = { firstName: "Alex", lastName: "Example", email: "Alex@Example.com", password: "copper kettle river sunrise" };

describe("sign-up rules", () => {
  it("accepts a good passphrase and tidies the email", () => {
    expect(signupSchema.parse(valid).email).toBe("alex@example.com");
  });

  it("needs 12 to 128 characters", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short pass" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(false);
  });

  it("refuses a password containing your name or email", () => {
    for (const password of ["alexsecretword1", "my example password", "alex@example.com!!"]) {
      const result = signupSchema.safeParse({ ...valid, password });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(["password"]);
    }
  });

  it("asks only for name, email and password: nothing truly private", () => {
    expect(Object.keys(signupSchema.parse(valid)).sort()).toEqual(["email", "firstName", "lastName", "password"]);
  });

  it("login only checks something was typed (never which rule a guess broke)", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
  });
});

describe("the password strength meter", () => {
  it("rates by length first", () => {
    expect(passwordStrength("short").label).toBe("Too short");
    expect(passwordStrength("abcdefghijkl").score).toBe(1);
    expect(passwordStrength("copper kettle river sunrise").label).toBe("Strong");
  });
});

describe("the login client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** A fake server: /csrf sets the token cookie; the next request answers with `status`. */
  function server(status: number, body: unknown = {}) {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=abc%3D123" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return url.endsWith("/csrf") ? new Response(null, { status: 204 }) : new Response(JSON.stringify(body), { status });
      }),
    );
    return calls;
  }

  it("sends the CSRF token back in the X-XSRF-TOKEN header", async () => {
    const calls = server(200);
    expect(await logIn({ email: "a@example.com", password: "secret" })).toEqual({ ok: true });
    expect(calls[0].url).toBe("/api/auth/csrf");
    expect((calls[1].init?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("abc=123");
  });

  it("gives the same message for an unknown email and a wrong password", async () => {
    server(401);
    const result = await logIn({ email: "a@example.com", password: "wrong" });
    expect(result).toEqual({ ok: false, message: "That email and password don't match." });
  });

  it("explains rate limiting", async () => {
    server(429);
    const result = await logIn({ email: "a@example.com", password: "wrong" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Too many attempts/);
  });

  it("points to the email field when the account already exists", async () => {
    server(409);
    const result = await signUp({ firstName: "A", lastName: "B", email: "a@example.com", password: "copper kettle river" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.email).toBeDefined();
  });

  it("says so calmly when the server can't be reached", async () => {
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const result = await logIn({ email: "a@example.com", password: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/couldn't reach Sterl/);
  });

  it("asks who is logged in, and answers null when nobody is", async () => {
    const me = { userId: "u", customerId: "c", email: "a@example.com", role: "customer", firstName: "Alex", lastName: "Example" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(me), { status: 200 })));
    expect(await getMe()).toEqual(me);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
    expect(await getMe()).toBeNull();
  });

  it("logs out on the server, with the CSRF token", async () => {
    const calls = server(204);
    await logOut();
    expect(calls[1].url).toBe("/api/auth/logout");
    expect(calls[1].init?.method).toBe("POST");
    expect((calls[1].init?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("abc=123");
  });

  it("after logging out, loads the login page fresh, only once the server has ended the session", async () => {
    const calls = server(204);
    const visited: string[] = [];
    await logOutAndLeave((url) => visited.push(`${url} after ${calls.length} requests`));
    expect(visited).toEqual(["/login after 2 requests"]); // csrf + logout, THEN leave
  });
});

