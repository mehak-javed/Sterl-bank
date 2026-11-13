import { describe, expect, it } from "vitest";
import { CLIENT_IP_HEADER, SECRET_HEADER, forwardedApiHeaders, isForwardedApiPath } from "./api-forwarding";

describe("forwardedApiHeaders", () => {
  it("passes on the visitor's address with the shared secret", () => {
    const out = forwardedApiHeaders(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }), "s3cret");
    expect(out.get(SECRET_HEADER)).toBe("s3cret");
    expect(out.get(CLIENT_IP_HEADER)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const out = forwardedApiHeaders(new Headers({ "x-real-ip": "198.51.100.4" }), "s3cret");
    expect(out.get(CLIENT_IP_HEADER)).toBe("198.51.100.4");
  });

  it("removes copies a browser tried to send, even when no secret is configured", () => {
    const sneaky = new Headers({ [SECRET_HEADER]: "guess", [CLIENT_IP_HEADER]: "1.2.3.4", "x-forwarded-for": "203.0.113.9" });
    for (const secret of [undefined, ""]) {
      const out = forwardedApiHeaders(sneaky, secret);
      expect(out.has(SECRET_HEADER)).toBe(false);
      expect(out.has(CLIENT_IP_HEADER)).toBe(false);
    }
    expect(forwardedApiHeaders(sneaky, "real").get(CLIENT_IP_HEADER)).toBe("203.0.113.9");
  });

  it("keeps the other headers (cookies, CSRF token)", () => {
    const out = forwardedApiHeaders(new Headers({ cookie: "SESSION=abc", "x-xsrf-token": "t" }), "s3cret");
    expect(out.get("cookie")).toBe("SESSION=abc");
    expect(out.get("x-xsrf-token")).toBe("t");
  });
});

describe("isForwardedApiPath", () => {
  it("matches only the API areas the website forwards", () => {
    expect(isForwardedApiPath("/api/auth/login")).toBe(true);
    expect(isForwardedApiPath("/api/payments")).toBe(true);
    expect(isForwardedApiPath("/api/fx/reference")).toBe(false);
    expect(isForwardedApiPath("/api/authority")).toBe(false);
    expect(isForwardedApiPath("/dashboard")).toBe(false);
  });
});
