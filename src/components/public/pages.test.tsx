import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CareersPage from "@/app/(public)/careers/page";
import RecruitmentScamsPage from "@/app/(public)/recruitment-scams/page";
import SecurityPage from "@/app/(public)/security/page";
import { FOOTER_LINKS, PublicFooter } from "./PublicFooter";

describe("the public footer", () => {
  const html = renderToStaticMarkup(<PublicFooter />);

  it("no longer shows the demo notice (removed at Mehak's request)", () => {
    expect(html).not.toContain("Not a real bank");
  });

  it("links to exactly Mehak's pages", () => {
    expect(FOOTER_LINKS.map((l) => l.label)).toEqual([
      "Home",
      "Careers",
      "Help",
      "Recruitment scams",
      "Security and confidentiality",
      "Log in",
      "Sign up",
    ]);
    expect(html).not.toContain(">Try the demo<");
    expect(html).not.toContain(">Source code<");
  });
});

describe("Careers", () => {
  const html = renderToStaticMarkup(<CareersPage />);

  it("has an Apply now on each role, opening the role's details page", () => {
    expect(html).toContain('href="/careers/jobs/software-engineer-java"');
    expect(html).toContain('aria-label="Apply now: Credit Risk Analyst"');
  });

  it("has no Apply now button at the top of the page (Mehak's choice)", () => {
    const heroEnd = html.indexOf('id="focus-heading"');
    expect(html.slice(0, heroEnd)).not.toContain("Apply now");
  });

  it("keeps the application form on its own page, not inside Careers", () => {
    expect(html).not.toMatch(/<(form|input|textarea)\b/);
  });
});

describe("Recruitment scams", () => {
  const html = renderToStaticMarkup(<RecruitmentScamsPage />);

  it("lists the warning signs and what Sterl will never do", () => {
    expect(html).toContain("Warning signs");
    expect(html).toContain("Sterl will never");
    expect(html).toContain("Ask for money at any stage");
  });

  it("only uses the reserved .example domain for contact addresses", () => {
    const emails = [...html.matchAll(/[\w.]+@[\w.]+/g)].map((m) => m[0]);
    expect(emails.length).toBeGreaterThan(0);
    for (const email of emails) expect(email).toMatch(/@sterl\.example$/);
  });
});

describe("Security and confidentiality", () => {
  const html = renderToStaticMarkup(<SecurityPage />);

  it("covers both security and confidentiality", () => {
    expect(html).toMatch(/>Security<\/h2>/);
    expect(html).toContain('id="confidentiality-heading"');
  });

  it("marks features that aren't built yet as coming, rather than claiming them", () => {
    expect(html).toContain("Your data, your choice (coming)");
  });
});

describe("the header menu", () => {
  it("is Home, Meet our community, Careers, Help (Mehak's choice)", async () => {
    const { PUBLIC_LINKS } = await import("./PublicHeader");
    expect(PUBLIC_LINKS.map((l) => [l.label, l.href])).toEqual([
      ["Home", "/"],
      ["Meet our community", "/#people"],
      ["Careers", "/careers"],
      ["Help", "/#help"],
    ]);
  });

  it("has a section on the home page for every link", async () => {
    const { default: HomePage } = await import("@/app/(public)/page");
    const html = renderToStaticMarkup(<HomePage />);
    for (const id of ["people", "security", "help"]) expect(html).toContain(`id="${id}"`);
  });

  it("no longer promises Face ID or Touch ID (dropped Nov 12)", async () => {
    const { default: HomePage } = await import("@/app/(public)/page");
    const html = renderToStaticMarkup(<HomePage />) + renderToStaticMarkup(<SecurityPage />);
    expect(html).not.toMatch(/Face ID|Touch ID/);
  });

  it("keeps the full Security and Help pages for the footer", () => {
    const labels = FOOTER_LINKS.map((l) => l.href);
    expect(labels).toContain("/security");
    expect(labels).toContain("/help");
  });
});

describe("the home page hero (Mehak, Nov 12)", () => {
  it("leads with Everyday money, made effortless, written for customers", async () => {
    const { default: HomePage } = await import("@/app/(public)/page");
    const html = renderToStaticMarkup(<HomePage />);
    const h1 = html.slice(html.indexOf("<h1"), html.indexOf("</h1>"));
    expect(h1).toContain("Everyday money,");
    expect(h1).toContain("made effortless");
    expect(html.match(/Everyday money,/g)).toHaveLength(1); // not repeated further down
  });

  it("no longer has the careers-style line or the 'calm place' line", async () => {
    const { default: HomePage } = await import("@/app/(public)/page");
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).not.toContain("Work that matters");
    expect(html).not.toContain("room to learn");
    expect(html).not.toContain("all in one calm place");
  });
});
