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
    expect(html).toContain("Security and confidentiality");
    expect(html).toContain('id="confidentiality-heading"');
  });

  it("marks features that aren't built yet as coming, rather than claiming them", () => {
    expect(html).toContain("Your data, your choice (coming)");
  });
});
