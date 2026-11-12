import { describe, expect, it, vi } from "vitest";

// The layout loads Google fonts through next/font, which only works inside Next's build: stand-ins.
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Geist: font, Geist_Mono: font, Cinzel: font };
});
const { metadata } = await import("./layout");
import robots from "./robots";
import sitemap from "./sitemap";

describe("search engines", () => {
  it("are allowed to list the site (no noindex)", () => {
    expect(metadata.robots).toBeUndefined();
  });

  it("get a sitemap of every public page, including each job's application page", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://sterl-bank.vercel.app/");
    expect(urls).toContain("https://sterl-bank.vercel.app/careers");
    expect(urls).toContain("https://sterl-bank.vercel.app/careers/apply/software-engineer-java");
    expect(urls.some((u) => u.includes("/dashboard"))).toBe(false);
  });

  it("are kept out of personal banking pages and the API", () => {
    const { rules, sitemap: map } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/dashboard", "/accounts/", "/api/"]));
    expect(map).toBe("https://sterl-bank.vercel.app/sitemap.xml");
  });
});
