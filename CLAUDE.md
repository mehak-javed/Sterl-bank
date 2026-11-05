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
- Done (Nov 5, 2026): Day 4 Zustand UI store (`src/stores/ui-store.ts` factory + `UiStoreProvider` per-session store, persist with skipHydration, theme/high-contrast/large-text as `data-*` on `<html>` styled in globals.css; `DisplaySettings` on home). `isCardFrozen` is in Zustand for now, moves to TanStack Query optimistic mutation on Day 5.
- Done (Nov 5, 2026): Day 5. API routes `app/api/{accounts,transactions,cards,cards/[id]}` over in-memory `src/server/bank-db.ts`; `simulateNetwork()` (calls `connection()` because `cacheComponents` is on in next.config, random 200–1000ms delay, 5% 503s, `STERL_SIMULATE_NETWORK=off` disables). TanStack Query: `QueryProvider`, `lib/api/{client,queries}.ts`, optimistic card freeze with rollback; card freeze removed from Zustand. Test card added (`cards.json`, last4 4242). Home page shows accounts, card, recent transactions.
- Done (Nov 5, 2026): Day 6. `/markets` FX desk. `app/api/fx/reference` (Frankfurter cached via `"use cache"` + `cacheLife("days")`, falls back to `src/mocks/data/fx-fallback.json`; refresh with `npm run fx:fallback`). `src/lib/fx.ts` (20 supported quotes, `convertFromPence` rounds once, minor-unit aware: JPY 0dp). Redux Toolkit in `src/stores/fx/` (watchlistSlice, ordersSlice with `prepare`, memoised `selectPositions`, per-session store, provider in root layout).
- Brand palette (Nov 5, 2026, switched from indigo/peach to black and gold): Black #0B0B0C, Charcoal #1C1C1E, Gold #D4AF37, Light gold #F7DD8B, Deep gold #8A6A1F. Role tokens in `globals.css` (background, surface, foreground, heading, line, primary, primary-fill, banner, accent, focus, positive, glass*, glow*); components use tokens, never hex. Buttons use `btn-primary` (gold gradient in dark). Bright gold fails as text on white: light mode headings use deep gold. High contrast overrides the brand. Dark is the default theme (`data-theme="dark"` on `<html>` + store default). Glass: `glass` utility over `body::before` glows; secondary text `text-muted`. One solid-gold block per page via `hero-gold` utility (dashboard: `BalanceHero`, total via `sumPence` in money.ts); it overrides `--focus` so the focus ring stays visible on gold.
- Done (Nov 5, 2026): Day 8 App Router pages. Route group `src/app/(bank)/` with shared layout (`SiteNav` with aria-current, skip link, the one `<main>`), `loading.tsx`, `error.tsx` (uses Next 16 `retry`), root `not-found.tsx`, title template "%s · Sterl". Pages: `/`, `/accounts/[id]` (generateStaticParams from bank-db, notFound() for unknown ids: a soft 404 with noindex, status 200, because Cache Components streams the shell first), `/transactions` (account select + shared `TransactionTable`), `/cards`, `/markets`; `/payments` and `/insights` are placeholders.
- Done (Nov 5, 2026): Day 9 Server vs Client Components. `src/server/queries.ts` (`import "server-only"`, React `cache()` per-request dedupe, `connection()` + short delay, no random failures) feeds Server Components: `BalanceHero`, `AccountsOverview` (only `AccountSelectButton` is client, server content passed as children), `AccountDetail`. Dashboard wraps each in its own `<Suspense>` with skeletons. Account page is not async: params promise passed into `AccountContent` inside Suspense (Next 16 instant-navigation rule: no URL data in the shell). `TransactionTable` is a shared presentational component used by server (account page) and client (`TransactionsView`). Still client: RecentTransactions, TransactionsView (depend on Zustand selection), CardPanel (mutation), FX desk.
- Done (Nov 5, 2026): Day 10 server actions. `src/server/actions.ts` ("use server"): `transferMoney` for `useActionState` (server-side validation with toPence, £10k max, 18-char reference, all field errors at once, values echoed back so React's form reset keeps them; idempotency key per form, completed keys replay the stored result; `refresh()` from next/cache) and `setRoundUps` (5% simulated failure). bank-db: `transferBetweenAccounts` (double-entry legs sharing transferId, all checks before any change, no await = atomic), round-ups setting. bank-db state lives on `globalThis.__sterlBank` because API routes and RSC/actions are separate bundles with separate module copies (found in testing). UI: `MoveMoney` (server wrapper, makes initial idempotency key) → `TransferForm` (client; invalidates TanStack accounts + transactions on success), `RoundUpSetting` → `RoundUpToggle` (`useOptimistic`, role="switch", auto-rollback). Known gap: on Vercel, separate function instances still have separate memory; the Postgres phase fixes it.
- Commits: only at the end of each sprint (Sprint 1 ends Day 13). Days 4–6 uncommitted for now.
- Next: Day 7, rest and review (catch up, refactor, write down what was learned). Then Day 8 App Router pages. Previous plan line, kept for reference: Week 1 Day 1–3: `src/lib/money.ts` (roundUp, formatGBP, toPence) with Vitest tests, then the seeded Faker generator.
- Lesson 1 homework (in progress): tests for roundUp (347→53, 500→0, 3.5 throws); write `toPence("12.34")` without parseFloat*100.
