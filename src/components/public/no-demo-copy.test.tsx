import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CareersPage from "@/app/(public)/careers/page";
import CookiesPage from "@/app/(public)/cookies/page";
import HelpPage from "@/app/(public)/help/page";
import LoginPage from "@/app/(auth)/login/page";
import HomePage from "@/app/(public)/page";
import RecruitmentScamsPage from "@/app/(public)/recruitment-scams/page";
import SecurityPolicyPage from "@/app/(public)/security/policy/page";
import SecurityPage from "@/app/(public)/security/page";
import SignUpPage from "@/app/(auth)/signup/page";
import { PublicFooter } from "./PublicFooter";

// The login and sign-up forms use the app router, which only exists inside Next.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// next/image needs next.config's allowed hosts, which tests don't load.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a test stand-in, never shipped to users
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

/**
 * Mehak's decision (Nov 11): the website reads as a real, new bank, with nothing saying "demo".
 * This test fails if wording like that creeps back into any public page.
 */
const BANNED = /\b(demo|fake|made[- ]up|portfolio demo|fictional|not a real bank|simulated)\b/i;

const PAGES: [string, () => React.ReactElement][] = [
  ["home", () => <HomePage />],
  ["careers", () => <CareersPage />],
  ["help", () => <HelpPage />],
  ["log in", () => <LoginPage />],
  ["sign up", () => <SignUpPage />],
  ["security", () => <SecurityPage />],
  ["security policy", () => <SecurityPolicyPage />],
  ["cookies", () => <CookiesPage />],
  ["footer", () => <PublicFooter />],
];

describe("no 'demo' wording on the website", () => {
  for (const [name, render] of PAGES) {
    it(`the ${name} page reads like a real bank`, () => {
      // Only the visible text: tags and attributes stripped.
      const text = renderToStaticMarkup(render()).replace(/<[^>]+>/g, " ");
      expect(text).not.toMatch(BANNED);
    });
  }

  it("still uses the word 'fake' where it describes scammers (recruitment scams)", () => {
    expect(renderToStaticMarkup(<RecruitmentScamsPage />)).toContain("fake interviews");
  });
});

describe("the security policy", () => {
  const html = renderToStaticMarkup(<SecurityPolicyPage />);

  it("tells people how to report, with the reserved .example address", () => {
    expect(html).toContain("security@sterl.example");
  });

  it("covers scope, rules, response times and a safe-harbour promise", () => {
    for (const heading of ["In scope", "Out of scope", "When you test, please", "What happens next", "Our promise to you"])
      expect(html).toContain(heading);
  });
});
