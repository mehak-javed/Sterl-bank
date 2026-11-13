# Sterl: working notes for Claude Code

Sterl is a full-stack banking platform built by Mehak Javed as a portfolio project for a Java / React / AI
software engineering role in wholesale credit risk. All data is invented; see [README.md](README.md).

## How to work with me
- Explain the "why" as you go, keep steps small, and review like a senior bank engineer. Teach inside the code
  (clear names and short comments) rather than setting homework.
- Verify "done" claims: run the tests, the build and the app before saying something works.
- **Git:** I create every commit, push and pull request myself. Claude may create a branch and edit files on it,
  run tests and local servers, then give me the exact commands, the compare link and the PR text. Never run
  `git commit`, `git push`, or open or merge PRs. (`gh` is not installed.)
- One branch and one PR per user story; CI and CodeQL green before merge; `main` is protected.
- Every AI-assisted change is reviewed line by line, covered by tests and logged in `AI_USAGE.md`.

## Non-negotiable rules
- **Money is integer pence** everywhere (`1234` = £12.34): `number` in TypeScript, `long`/`BIGINT` in Java and
  SQL, never `double`/`float`. Credit limits and exposure too. Pounds only for display.
- **Data is 100% invented** ([ADR-002](docs/adr/002-fake-data-only.md)): seeded generators, invented company
  names, published test card numbers only. No real payment, card, bank or identity system is ever contacted.
  Open banking only ever in a provider's sandbox.
- **The website reads as a real, new bank:** no "demo", "mock", "fake", "dummy", "portfolio", "simulated" or
  similar wording on the site (`no-demo-copy.test.tsx` enforces it). Portfolio context belongs in the repo.
- Forms never ask for truly private data (no passport, NI number, date of birth, bank details). No claim of
  FCA/PRA authorisation. Contact addresses use `@sterl.example`. No facial recognition, no passkeys.
- Own brand only (black and gold, `docs/design-system.md`); never another bank's names, logos or colours.
- No secrets in the repo or in AI prompts: `.env.local` and host settings only.
- **AI:** fixed wording by default; Claude only when `STERL_AI_ENABLED=true` and `ANTHROPIC_API_KEY` are both
  set. Rules decide, the AI only explains, from an allow-list of redacted facts ([ADR-006](docs/adr/006-rules-decide-ai-explains.md)).
- Never enter test logins on the live production site.

## Stack and layout
- **Website** (repo root): Next.js 16 App Router + React + TypeScript, Tailwind, TanStack Query, Zustand,
  Redux Toolkit, React Hook Form + Zod, Vitest + RTL. `AGENTS.md` applies: read `node_modules/next/dist/docs/`
  before using Next.js APIs. Route groups `(public)`, `(auth)`, `(bank)`; route guard in `src/proxy.ts`;
  `/api/{auth,accounts,cards,transfers,payees,payments,risk}/*` rewritten to `STERL_API_URL`
  (`src/lib/api-origin.ts`); server calls via `src/server/sterl-api.ts`.
- **API** (`sterl-api/`): Java 25, Spring Boot 4.1, Spring Security + Spring Session JDBC, JdbcClient with
  hand-written SQL, Flyway (`db/migration` + `db/seed`), JUnit against a real PostgreSQL 18.
- **Data generators:** `npm run seed` regenerates the JSON fixtures and seed SQL (customer history and the
  lending book). CI fails if committed seed SQL is out of date.
- Design and decisions: `docs/architecture.md`, `docs/adr/`, `docs/responsible-ai.md`, `docs/database-guide.md`,
  `docs/design-system.md`, `docs/user-stories.md`, `docs/role-coverage.md`.

## Local development
- PostgreSQL via Postgres.app (`/Applications/Postgres.app/Contents/Versions/latest/bin`), databases `sterl`
  and `sterl_test`, local user without a password.
- API: `cd sterl-api && STERL_COOKIE_SECURE=false ./mvnw spring-boot:run` (port 8080). Tests: `./mvnw verify`.
- Website: `npm run dev` (port 3000). Checks: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.
- My own servers use 8080 and 3000; for end-to-end checks Claude uses a throwaway database plus ports 8081/3100,
  and cleans up afterwards.
- Test logins are listed in `docs/demo-accounts.md`.

## Engineering habits
- Tests with every feature; for key rules, a mutation check (break the rule, confirm a test fails).
- Concurrency-sensitive code: lock in a fixed order, test with parallel requests.
- Every customer query scoped to the logged-in customer; isolation tested both ways.
- Every sensitive action written to the append-only audit log.

## Plan and status
- Plan: `docs/Sterl_Banking_App_Project_Plan.pdf`, changed by `docs/REQUIRED CHANGES.pdf`. If short on time,
  protect: Java API + SQL, then the Credit Risk desk, then CI and tests, then deployment.
- Done: personal banking on the Java API (sign-up, login, accounts, transfers, cards, Add money, payees),
  AI payment screening with a staff review queue, the risk officer login and the lending book (CR1, CR2).
- Live (Nov 13): website https://sterl-bank.vercel.app (Vercel project `sterl-bank`; `sterl-bank-1195` is a
  duplicate to remove), API https://sterl-bank-v1.onrender.com (Render, Docker, Frankfurt, free, sleeps when idle),
  PostgreSQL on Neon (Frankfurt). Setup in `docs/deploy.md`.
- Next: AI stories #42 (cash flow), #41 (policy Q&A), #43 (with "Explore as a guest":
  a real guest login, sample data, deleted after 7 days); then Credit Risk CR3–CR6 (exposure engine, SQL
  reports, AG Grid desk, breach alerts); then Google sign-in and saved job applications.
