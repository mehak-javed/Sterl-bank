import { describe, expect, it } from "vitest";
import { isProtected, safeNext } from "./guard";

describe("which pages need a login", () => {
  it("protects every personal banking page, including nested ones", () => {
    for (const path of ["/dashboard", "/accounts/abc", "/transactions", "/payments", "/cards", "/markets", "/credit-risk"])
      expect(isProtected(path)).toBe(true);
  });

  it("leaves the public site open", () => {
    for (const path of ["/", "/login", "/signup", "/careers", "/careers/jobs/x", "/help", "/security", "/dashboardish"])
      expect(isProtected(path)).toBe(false);
  });
});

describe("where to go after logging in", () => {
  it("returns people to the page they asked for", () => {
    expect(safeNext("/cards")).toBe("/cards");
    expect(safeNext("/accounts/abc?tab=2")).toBe("/accounts/abc?tab=2");
  });

  it("never leaves the site (no open redirect for phishing emails)", () => {
    for (const evil of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", ""])
      expect(safeNext(evil)).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});
