# Sterl — project context for Claude

## Who I am and how to work with me
- I'm Mehak (MSc Computer Science, software engineering experience, Claude Code certificate). I'm building Sterl as a portfolio project for one target role.
- **Target role: JPMorganChase Software Engineer III – Java / React / AI, Wholesale Credit Risk, Glasgow.** Java first, then React, then AI-assisted engineering, inside a credit risk business. Also apply: graduate Software Engineer Program, Code for Good, other UK banks/fintechs.
- **Follow the plan exactly:** `docs/Sterl_Banking_App_Project_Plan.pdf` (updated Nov 5, 2026). Its week/day order is the build order. If behind, protect in this order: Java API + SQL → Credit Risk desk → CI and tests → deploy. FX desk, Ask Sterl and extras can follow launch.
- **Teach me as you go.** Explain the "why", keep steps small, review like a senior bank engineer. I'm short on time: teach the technical points inside the code you write rather than assigning homework.
- Verify my "done" claims (trust but verify).

## The project
- **Sterl**: a demo banking **web app** (responsive website, not a native app), three parts:
  1. Personal banking dashboard (inspired by Chase UK): accounts, transactions, send money, cards, round-ups.
  2. **Credit Risk desk** (matches the target team): 500 fake counterparties, 2,000+ facilities, exposure, limit utilisation (<75% fine, 75–100% warning, >100% breach), breaches → alert + audit log + "needs review" queue, concentration by sector/rating, rating downgrade event, AG Grid + charts + CSV export.
  3. Live FX desk (inspired by trading screens): 30+ pairs ticking, AG Grid, mock orders.
- Front end: Next.js. Core banking logic: **Java + Spring Boot API over PostgreSQL** (from week 2).

## Stack
- Front end: Next.js (App Router) + React + TypeScript, Tailwind, Zustand, Redux Toolkit, TanStack Query, React Hook Form + Zod, AG Grid, Vitest, React Testing Library, MSW, Playwright. Vercel.
- Back end: Java + Spring Boot (`sterl-api`), PostgreSQL with Flyway migrations, double-entry ledger, audit log, hand-written SQL reports (JOIN, GROUP BY, window functions), JUnit, Bean Validation, Spring Security (2FA, roles: customer, risk officer, admin). Docker, AWS free tier with a budget alert.
- Process: GitHub Actions CI (lint, typecheck, tests, build; Java job from week 2), GitHub Projects board with user stories + acceptance criteria, one branch + PR per story (CI green before merge), weekly release tags (v0.1, v0.2…), ADRs in `docs/adr/`, `docs/architecture.md` system diagram, `AI_USAGE.md` log, `.github/pull_request_template.md`, `docs/responsible-ai.md`.

## Non-negotiable rules
- **Money is always integer pence** (`1234` = £12.34), in TypeScript AND Java (`long`, never `double`/`float`). Credit limits and exposure too. Pounds only for display.
- **100% fake data. No FCA or third-party approval needed; no real data ever.**
  - Customers/accounts/transactions/payees and counterparties/facilities: Faker.js with a fixed seed (`faker.seed(42)`), JSON fixtures in `src/mocks/data/`, loaded into PostgreSQL. Never real company names.
  - Bank API: Next.js route handlers in week 1 (random delay + occasional errors), then the Java API.
  - Tests: MSW handlers for the same URLs.
  - FX reference rates: Frankfurter (`https://api.frankfurter.dev/v2/rates?base=gbp`, no key), cached daily, with `fx-fallback.json`.
  - Live FX ticks: our own random-walk simulator over WebSocket/SSE, labelled "Simulated prices, not for trading".
  - Cards: published test numbers only (e.g. 4242 4242 4242 4242).
  - Payee name check: simulated against our fake payee list.
  - Ask Sterl (AI): reads only an allow-list of fake fields; answers checked against SQL; questions treated as untrusted input.
  - Optional TrueLayer/Plaid **sandbox only**, never live mode.
- Banner on every page: "Sterl is a portfolio demo. Not a real bank. All data is fake."
- Never commit secrets; `.env.local` (gitignored), Vercel/AWS env settings. No secrets or sensitive data in AI prompts.
- Own brand only: never Chase or JPMorgan names, logos or colours in the UI.
- **Tests come with every feature** (Vitest/RTL/Playwright on the front end, JUnit on the back end). Every AI-written change is covered by tests, reviewed, and logged in `AI_USAGE.md`.
- PR checklist: tests added/updated and CI green; money in integer pence; no secrets or real personal data; AI code reviewed line by line and logged.

## Build plan (from the PDF)
- **Week 1, front end on fake data + CI from day one:** D1–2 set-up, banner, money helpers ✅ · D3 GitHub Actions CI, Projects board with week 1–4 stories, PR template, seeded generator · D4 Zustand ✅ · D5 mock API + TanStack Query + optimistic card freeze ✅ · D6 App Router pages (dashboard, accounts/[id], transactions, send money, cards, **credit risk**, markets), Server vs Client Components · D7 review: ADR-001 (integer pence), ADR-002 (fake data only), first architecture diagram, tag v0.1, deploy to Vercel.
- **Week 2, Java + Spring Boot + PostgreSQL:** D8 `sterl-api`, health endpoint, JUnit, Java job in CI · D9 schema with Flyway (accounts, double-entry ledger, payees, audit log), seed from the Faker JSON · D10 REST accounts/transactions, filtering + pagination in SQL · D11 transfers with idempotency keys, balanced ledger entries, JUnit proof · D12 front end switched to the Java API; send money with React Hook Form + Zod + simulated payee name check · D13 cards and round-ups through the API; every sensitive action in the audit log · D14 review: ADR-003 (Java API + Next.js), diagram update, release v0.2.
- **Week 3, Credit Risk + FX:** D15 generate counterparties, facilities, drawdowns; tables + migrations · D16 Java `ExposureService` (exposure, utilisation, breach detection, integer maths), JUnit edge cases (zero limit, exactly 100%, downgrade), ADR-004 · D17 SQL reports (top 10 exposures, breaches this week, exposure by sector and rating) as API endpoints · D18 credit risk dashboard: AG Grid with utilisation bars, counterparty drill-down, concentration charts, CSV export, breach alerts · D19 FX desk: simulator streaming into AG Grid with batched updates, Frankfurter + fallback · D20 RTL tests (forms, risk grid), Playwright (send money, breach review) · D21 review: Lighthouse 90+, accessibility audit, release v0.3.
- **Week 4, secure, AI, cloud, launch:** D22 Spring Security login with 2FA, roles · D23 Ask Sterl with guardrails, `docs/responsible-ai.md` · D24 Docker for the API; API + PostgreSQL on AWS free tier with budget alert; front end on Vercel · D25 observability: structured logs, health checks, error tracking, alert on API errors · D26 security and code-quality pass: dependency audit, secrets scan, finish `AI_USAGE.md` · D27 launch v1.0: README (screenshots, architecture, CI badge, "bank thinking", "Data and regulation") · D28 job prep: 5-minute walkthrough video, CV, apply.
- After launch: events (Kafka/Redis streams) for downgrades and fraud alerts, fraud rules engine, stress test ("every BB downgraded"), Terraform, optional open banking sandbox.

## Where we are (Nov 6, 2026)
- Repo: github.com/mehak-javed/Sterl-bank, `main` at 15cc2a0 (pushed). New plan PDF moved into `docs/` (Nov 6).
- **Built so far (front end, Next.js 16 with `cacheComponents` + `partialPrefetching`):**
  - Money: `src/lib/money.ts` (`formatGBP`, `roundUp`, `toPence` written by Mehak, `sumPence`, `assertPence`), 27 Vitest tests.
  - Data: `src/mocks/generate.ts` (seed 42, fixed REF_DATE 2026-11-01, 90 days, double-entry transfers, balance self-check) → `npm run seed` → `src/mocks/data/*.json`. Types in `src/types/bank.ts`.
  - Zustand UI store (`src/stores/ui-store.ts` + `UiStoreProvider`, persist with skipHydration; theme/high-contrast/large-text as `data-*` on `<html>`).
  - Mock API `app/api/{accounts,transactions,cards,cards/[id],fx/reference}` over in-memory `src/server/bank-db.ts` (state on `globalThis.__sterlBank`, because API routes and RSC/actions are separate bundles). `simulateNetwork()`: `connection()`, 200–1000ms delay, 5% 503s, `STERL_SIMULATE_NETWORK=off`.
  - TanStack Query (`lib/api/{client,queries}.ts`), optimistic card freeze with rollback.
  - FX desk `/markets`: Frankfurter via `"use cache"` + `cacheLife("days")` with fallback, `src/lib/fx.ts`, Redux Toolkit watchlist + orders.
  - Pages in route group `src/app/(bank)/`: layout (`SiteNav`, skip link, one `<main>`), `loading.tsx`, `error.tsx` (`retry`), root `not-found.tsx` (soft 404 with noindex under Cache Components), title template. `/`, `/accounts/[id]`, `/transactions`, `/cards`, `/markets`, placeholders `/payments` and `/insights`.
  - Server Components via `src/server/queries.ts` (`server-only`, React `cache()`, `connection()`): `BalanceHero`, `AccountsOverview` (client `AccountSelectButton` with server children), `AccountDetail`; Suspense per block; account page passes the params promise into Suspense (instant-navigation rule).
  - Server actions `src/server/actions.ts`: `transferMoney` (useActionState, server validation, idempotency keys, double-entry `transferBetweenAccounts`, `refresh()`), `setRoundUps` (`useOptimistic` switch). These were built from the OLD plan's Days 9–10; in the new plan transfers move to the Java API on Days 11–13 (the server action can then call the Java API).
  - Theme: black and gold role tokens in `globals.css` (Black #0B0B0C, Charcoal #1C1C1E, Gold #D4AF37, Light gold #F7DD8B, Deep gold #8A6A1F); components use tokens, never hex; `glass`, `btn-primary`, one `hero-gold` block per page; dark default; light-mode headings deep gold; high contrast overrides the brand.
- **Week 1 gaps closed (merged Nov 10, PRs #1–#4, CI green on `main`):**
  - CI: `.github/workflows/ci.yml` (Node from `.nvmrc` = 24, `npm ci`, lint, typecheck, `test:run`, build, `STERL_SIMULATE_NETWORK=off`), `.github/pull_request_template.md`, `docs/user-stories.md` (22 stories, weeks 1–4), CI badge in README; `typecheck` script is `next typegen && tsc --noEmit` (fresh clones lack `.next/types`).
  - `/insights` → `/credit-risk` (glossary placeholder), `src/lib/nav.ts` (`NAV_LINKS`, segment-aware `isActivePath`) with `nav.test.ts` (33 Vitest tests total).
  - Docs: `docs/adr/001-integer-pence.md`, `docs/adr/002-fake-data-only.md`, `docs/architecture.md` (Mermaid: now + target), `AI_USAGE.md`.
  - Still to do by Mehak: Projects board from `docs/user-stories.md`, Vercel deploy, tag `v0.1`, branch protection on `main` (require both CI checks).
- **Day 8 done (merged Nov 10, PR #2):** `sterl-api/` Spring Boot **4.1.2 on Java 25** (Temurin 25 LTS installed, not 21), Maven Wrapper (`./mvnw`, Maven 3.10.0), starters webmvc + actuator + validation. `application.properties`: port 8080, Actuator exposes only `health,info`, `show-details=never`, liveness/readiness probes, info carries the demo disclaimer. JUnit (`HealthEndpointTests` with `MockMvcTester`, `@AutoConfigureMockMvc` from `org.springframework.boot.webmvc.test.autoconfigure`): health UP, probes UP, no component details, env/beans/heapdump 404, disclaimer; 6 tests. `.github/workflows/api.yml` (setup-java temurin 25, maven cache, `./mvnw -B -ntp verify`, no paths filter so it can be a required check). Mehak once committed `sterl-api/target/` to main by mistake (24 MB jar stays in history); untracked in PR #2, ignored by `sterl-api/.gitignore`.
- Duplicate plan copy in `Claude outputs/` is committed on main; remove it in a later PR.
- **Next: Day 9** PostgreSQL schema with Flyway (accounts, double-entry ledger, payees, audit log), seeded from the Faker JSON. Needs PostgreSQL on this Mac (Postgres.app recommended; no Homebrew). Tests should use Testcontainers or a test database (Docker isn't installed; decide on Day 9). `gh` CLI is not installed: PRs are opened in the GitHub web UI via compare links.
