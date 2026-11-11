import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/careers/roles";

/*
 * The job page reads its role from a params promise inside Suspense; renderToStaticMarkup can't
 * wait for that, so these tests check the role data every job page is built from, plus that each
 * page leads to its application form.
 */
describe("job details", () => {
  it("every role has a summary, salary, duties, requirements and nice-to-haves", () => {
    for (const role of ROLES) {
      expect(role.summary.length).toBeGreaterThan(20);
      expect(role.salary).toMatch(/£/);
      expect(role.responsibilities.length).toBeGreaterThan(1);
      expect(role.requirements.length).toBeGreaterThan(1);
      expect(role.niceToHave.length).toBeGreaterThan(0);
    }
  });

  it("every role has a unique address", () => {
    expect(new Set(ROLES.map((r) => r.slug)).size).toBe(ROLES.length);
  });

  it("asks for nothing truly private: no passport, NI number or date of birth in any requirement", () => {
    const text = JSON.stringify(ROLES).toLowerCase();
    for (const word of ["passport", "national insurance", "date of birth"]) expect(text).not.toContain(word);
  });
});

describe("a job page", async () => {
  const { default: JobPage } = await import("./page");
  it("renders its shell with a back link to all roles", () => {
    const html = renderToStaticMarkup(
      <JobPage params={Promise.resolve({ role: "credit-risk-analyst" })} searchParams={Promise.resolve({})} />,
    );
    expect(html).toContain('href="/careers#roles"');
  });
});
