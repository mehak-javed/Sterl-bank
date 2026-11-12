import { describe, expect, it } from "vitest";
import { homeFor, isProtected, safeNext, redirectForRole } from "./guard";

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

describe("who may open which page", () => {
  it("keeps customers out of the Credit Risk desk and sends them home", () => {
    expect(redirectForRole("/credit-risk", "customer")).toBe("/dashboard");
    expect(redirectForRole("/credit-risk/some-company", "customer")).toBe("/dashboard");
  });

  it("keeps risk staff out of customers' banking pages and sends them to the desk", () => {
    for (const page of ["/dashboard", "/accounts/abc", "/transactions", "/payments", "/cards"]) {
      expect(redirectForRole(page, "risk_officer")).toBe("/credit-risk");
      expect(redirectForRole(page, "admin")).toBe("/credit-risk");
    }
  });

  it("lets each role into its own pages", () => {
    expect(redirectForRole("/dashboard", "customer")).toBeNull();
    expect(redirectForRole("/accounts/abc", "customer")).toBeNull();
    expect(redirectForRole("/credit-risk", "risk_officer")).toBeNull();
    expect(redirectForRole("/markets", "risk_officer")).toBeNull();
    expect(redirectForRole("/markets", "customer")).toBeNull();
  });

  it("treats an unknown role as having no access, rather than any", () => {
    expect(redirectForRole("/credit-risk", "intern")).toBe("/");
    expect(redirectForRole("/dashboard", "intern")).toBe("/"); // never back to a page it can't open: no redirect loop
  });

  it("protects the desk like every other personal page", () => {
    expect(isProtected("/credit-risk")).toBe(true);
    expect(homeFor("risk_officer")).toBe("/credit-risk");
    expect(homeFor("customer")).toBe("/dashboard");
  });
});
