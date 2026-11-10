import { describe, expect, it } from "vitest";
import { NAV_LINKS, isActivePath } from "./nav";

describe("isActivePath", () => {
  it("matches the dashboard only on the exact home path", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/cards", "/")).toBe(false);
  });

  it("matches a section's own page and the pages below it", () => {
    expect(isActivePath("/credit-risk", "/credit-risk")).toBe(true);
    expect(isActivePath("/credit-risk/acme-ltd", "/credit-risk")).toBe(true);
  });

  it("does not match a different path that only starts with the same letters", () => {
    expect(isActivePath("/cardsharp", "/cards")).toBe(false);
  });

  it("does not match a different section", () => {
    expect(isActivePath("/markets", "/credit-risk")).toBe(false);
  });
});

describe("NAV_LINKS", () => {
  it("includes the Credit risk desk", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/credit-risk", label: "Credit risk" });
  });

  it("marks exactly one link active on every nav page", () => {
    for (const { href } of NAV_LINKS) {
      const active = NAV_LINKS.filter((link) => isActivePath(href, link.href));
      expect(active).toHaveLength(1);
    }
  });
});
