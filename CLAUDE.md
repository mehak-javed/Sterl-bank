# Sterl — project context for Claude

## Who I am and how to work with me
- I'm Mehak, a learner building Sterl as a portfolio project to get hired at JPMorgan (London, React/UI roles; likely route: graduate Software Engineer Program / Code for Good).
- **Teach me as you go.** Explain the "why" behind each decision, keep steps small, and let me write key code myself where it helps me learn. Review my code like a senior bank engineer would.
- Give me a short homework/exercise at the end of each lesson.

## The project
- **Sterl** is a demo banking **web app** (responsive website, not a native phone app). Two sides: personal banking dashboard (inspired by Chase UK) + a live FX markets desk (inspired by JPMorgan trading screens).
- Goal: launch a live portfolio version in about one month.
- Full plan: `docs/Sterl_Banking_App_Project_Plan.pdf` — follow its build plan and week order.

## Stack
Next.js (App Router) + React + TypeScript, Tailwind, Zustand, Redux Toolkit, TanStack Query, React Hook Form + Zod, AG Grid, Vitest, React Testing Library, MSW, Playwright. Deploy on Vercel. Later: Java + Spring Boot + PostgreSQL (double-entry ledger).

## Non-negotiable rules
- **Money is always integer pence** (`1234` = £12.34). Never floats for money. Convert to pounds only for display.
- **100% fake data. No FCA or third-party approval is needed, and no real data is ever used.**
  - Customers/accounts/transactions/payees: Faker.js with a fixed seed (`faker.seed(42)`), saved as JSON fixtures in `src/mocks/data/`.
  - Bank API: our own Next.js route handlers in `app/api/...`, with random delay + occasional errors.
  - Tests: MSW handlers for the same URLs.
  - FX reference rates: Frankfurter (`https://api.frankfurter.dev/v2/rates?base=gbp`, no key), cached daily, with `fx-fallback.json`.
  - Live FX ticks: our own random-walk simulator over WebSocket/SSE, labelled "Simulated prices".
  - Cards: published test numbers only (e.g. 4242 4242 4242 4242).
  - Payee name check: simulated against our fake payee list.
  - Optional TrueLayer/Plaid **sandbox only** — never live mode.
- Banner on every page: "Sterl is a portfolio demo. Not a real bank. All data is fake."
- Never commit secrets; use `.env.local` (gitignored) and Vercel env settings.
- Own brand only — never Chase or JPMorgan names, logos or colours in the UI.

## Where we are
- Done: plan written and updated (Nov 4, 2026). Decided: website first; money foundation first.
- Done (Nov 4, 2026): Next.js 16 app scaffolded (TS, Tailwind, ESLint, App Router, `src/`), demo banner in root layout, `git init` on `main`.
- Done (Nov 4, 2026): pushed to github.com/mehak-javed/Sterl-bank. Vitest set up; `src/lib/money.ts` has `formatGBP` (worked example, tested); `roundUp`/`toPence` are stubs for me with `it.todo` tests.
- Done (Nov 5, 2026): I implemented roundUp + toPence (27 tests pass). Seeded generator `src/mocks/generate.ts` (seed 42, fixed REF_DATE 2026-11-01, double-entry transfers, balance self-check) → `npm run seed` writes `src/mocks/data/*.json`. Types in `src/types/bank.ts`.
- Mehak is short on time: teach the technical points in code, don't assign extra tests.
- Next: Week 1 Day 4, the Zustand store. Previous plan line, kept for reference: Week 1 Day 1–3: `src/lib/money.ts` (roundUp, formatGBP, toPence) with Vitest tests, then the seeded Faker generator.
- Lesson 1 homework (in progress): tests for roundUp (347→53, 500→0, 3.5 throws); write `toPence("12.34")` without parseFloat*100.
