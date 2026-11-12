import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import CareersPage from "@/app/(public)/careers/page";
import HelpPage from "@/app/(public)/help/page";
import LoginPage from "@/app/(auth)/login/page";
import HomePage from "@/app/(public)/page";
import RecruitmentScamsPage from "@/app/(public)/recruitment-scams/page";
import SecurityPolicyPage from "@/app/(public)/security/policy/page";
import SecurityPage from "@/app/(public)/security/page";
import SignUpPage from "@/app/(auth)/signup/page";
import { PublicFooter } from "./PublicFooter";

// The login and sign-up forms use the app router, which only exists inside Next.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// next/image needs next.config's allowed hosts, which tests don't load.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a test stand-in, never shipped to users
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

/**
 * Mehak's decision (Nov 11, widened Nov 12): the website reads as a real, new bank. No "demo",
 * "demonstration", "mock", "portfolio", "dummy" or "fake" anywhere a visitor can read. The portfolio
 * context lives in the GitHub repo instead. This test fails if any of it creeps back.
 */
const BANNED = /\b(demo|demonstration|mock|portfolio|dummy|fake|made[- ]up|fictional|not a real bank|simulated)\b/i;

const PAGES: [string, () => React.ReactElement][] = [
  ["home", () => <HomePage />],
  ["careers", () => <CareersPage />],
  ["help", () => <HelpPage />],
  ["log in", () => <LoginPage />],
  ["sign up", () => <SignUpPage />],
  ["security", () => <SecurityPage />],
  ["security policy", () => <SecurityPolicyPage />],
  ["recruitment scams", () => <RecruitmentScamsPage />],
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

  // Pages that need a logged-in session or browser state can't be rendered here, so also read the
  // SOURCE of every page and component: words in visible strings, outside code comments and imports.
  it("no page or component's source says it", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(["src/app", "src/components", "src/lib", "src/server", "src/stores"])) {
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "") // JSX comments
        .split("\n")
        .filter((line) => !/^\s*(\/\/|import\s|\*)/.test(line))
        .map((line) => line.replace(/\s\/\/\s.*$/, "")) // trailing comments
        .join("\n");
      const hit = code.match(BANNED);
      if (hit) offenders.push(`${file}: "${hit[0]}"`);
    }
    expect(offenders).toEqual([]);
  });
});

/** Every .ts/.tsx file under the given folders, except tests (which name the banned words on purpose). */
function sourceFiles(dirs: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
    }
  };
  dirs.forEach(walk);
  return out;
}
