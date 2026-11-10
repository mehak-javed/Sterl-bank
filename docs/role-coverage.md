# Role coverage: how Sterl answers the target job posting

**Target role:** JPMorganChase, Software Engineer III, Wholesale Credit Risk (Glasgow).
Checked against the posting text on 10 November 2026.

What the posting says, and doesn't say:

- It doesn't mention React Native, mobile, iOS or Android. The only front-end line is *preferred*:
  "familiarity with modern front-end technologies".
- Most of it is about **engineering practice**: secure production code, algorithms, AI-assisted
  development with validation, design artifacts, data analysis and visualisation, testing,
  operational stability, CI/CD and security.
- One requirement Sterl can't replace: experience "in a large corporate environment". That comes
  from real work history. Sterl shows the same habits in a project you can open and inspect.

Status: ✅ done · 🔜 planned (when) · ➕ new extra added on 10 Nov to close a gap.

## Job responsibilities

| Posting asks for | How Sterl shows it | Status |
| --- | --- | --- |
| Execute software solutions, design, development, troubleshooting; think beyond conventional approaches | Full-stack bank built end to end; real bugs found and fixed are logged (e.g. two copies of the in-memory bank across Next.js bundles, the soft-404 under Cache Components) | ✅ ongoing |
| Secure, high-quality production code | Server-side validation, bound SQL parameters only, problem-details errors, locked-down Actuator, secrets only in env vars; Spring Security login with Argon2id, server-side sessions, CSRF, security headers, login throttling, and tests proving customers can't see each other's data; security pass | ✅ (API login, Nov 10) / 🔜 Auth sprint B, Day 26 |
| ➕ Static analysis and dependency automation | **CodeQL** code scanning (security-extended), **Dependabot** updates for npm, Maven and GitHub Actions, GitHub **secret scanning** with push protection, `SECURITY.md` with private vulnerability reporting | ✅ Nov 10 (extra 1) |
| Maintain algorithms that run synchronously with other systems | Double-entry ledger with idempotent transfers; `ExposureService` (exposure, utilisation, breaches) shared by the API and the reports | 🔜 Day 11, Day 16 |
| ➕ Scheduled jobs that run in step with the ledger | End-of-day **reconciliation job** (ledger vs. balances, legs sum to zero) and a daily **exposure snapshot** job, with results stored and alerted | ➕ Week 3 (with Days 16–17) |
| Use enterprise-authorised AI coding tools, validated through peer review, automated testing and secure coding standards | Built with Claude Code; `AI_USAGE.md` logs what the AI produced, how it was checked, and what was fixed; tests with every change; **mutation checks** prove the tests can fail; PR checklist | ✅ ongoing |
| ➕ Peer review of AI output | An **AI review pass on every PR** (findings recorded in the PR), plus a human review: invite one friend or classmate as a reviewer for key PRs | ➕ from Day 11 |
| SDLC toolchain, including AI-assisted development and automation | GitHub Actions CI (front end + Java + PostgreSQL), Projects board with user stories, PR template, branch protection, releases, Vercel auto-deploy | ✅ |
| ➕ More automation | Auto-generated release notes, Dependabot PRs checked by CI, the seed-SQL-in-sync check | ➕ Week 2 / ✅ seed check |
| Architecture and design artifacts; ensure the code meets the design | ADR-001, ADR-002, architecture diagram; ADR-003 (Java API + Next.js), ADR-004 (exposure), ADR-005 (authentication) + threat model; tests that enforce design rules (e.g. "no float money columns") | ✅ / 🔜 Days 14, 16, Auth sprint A |
| ➕ Flow diagrams | **Sequence diagrams** for login with passkey, transfer with idempotency key, and account opening with identity check | ➕ with ADR-005 and Day 14 |
| Gather, analyse and visualise large, diverse data sets | Credit Risk desk: 500 counterparties, 2,000+ facilities, AG Grid, concentration charts, CSV export; SQL reports with JOIN, GROUP BY and window functions | 🔜 Days 15–18 |
| ➕ Visualise data *to improve the software itself* | An **engineering health page**: API latency (p50/p95), error rate, slowest endpoints, test counts and CI duration, from Micrometer metrics | ➕ Day 25 (observability) |
| Find hidden problems and patterns in data; use them to improve code and architecture | Breach and concentration alerts, subscription detector, fraud alerts; reconciliation job that flags anomalies | 🔜 Weeks 3–4 / ➕ Week 3 |
| ➕ Performance evidence | `EXPLAIN ANALYZE` on every report query with the index choices written down; a **k6 load test** of the key endpoints with results in the README | ➕ Days 17 and 20 |

## Required qualifications

| Posting asks for | How Sterl shows it | Status |
| --- | --- | --- |
| Formal training in software engineering | MSc Computer Science; Claude Code certificate | ✅ (CV) |
| System design, application development, testing, operational stability | Next.js + Java API + PostgreSQL design; Vitest, JUnit against real PostgreSQL, React Testing Library, Playwright; health checks, liveness and readiness probes | ✅ / 🔜 Day 20, Day 25 |
| Modern programming language(s) and database querying languages | Java 25, TypeScript, hand-written SQL (Flyway migrations, triggers, views, window functions) | ✅ |
| AI-assisted development, critically evaluating output for correctness, **performance** and security | `AI_USAGE.md` with corrections made; mutation checks; ➕ performance checks (EXPLAIN, k6) on AI-written queries and endpoints | ✅ / ➕ |
| Responsible AI: data sensitivity, secure inputs and outputs, resiliency | Ask Sterl: field allow-list, fake data only, questions treated as untrusted input, answers checked against SQL; `docs/responsible-ai.md`; no secrets in prompts | 🔜 Day 23 |
| ➕ "Guide peers on safe and effective AI usage" | `docs/ai-guidelines.md`: a short team guide (what never goes into a prompt, how to review AI code, when to say no) | ➕ Week 2 |
| SDLC knowledge | User stories, branches, PRs, CI, releases, ADRs | ✅ |
| Agile: CI/CD, application resiliency, security | CI on every PR; CD for the front end now and for the Java API on AWS (Day 24); retries, fallbacks (FX), idempotency; auth and security pass | ✅ / 🔜 |
| ➕ Resiliency in the Java API | Timeouts, retries and a circuit breaker (Resilience4j) around external calls (identity provider, FX rates); tests showing that a database outage turns readiness DOWN and returns a clean 503 | ➕ Auth sprint B and Day 25 |

## Preferred

| Posting asks for | How Sterl shows it | Status |
| --- | --- | --- |
| Modern front-end technologies | Next.js 16, React 19, TypeScript, TanStack Query, Zustand, Redux Toolkit, AG Grid; accessible, mobile-first; front-end refresh phase | ✅ / 🔜 |
| Cloud | Java API + PostgreSQL on AWS free tier with a budget alert (Docker); front end on Vercel | 🔜 Day 24 |

## The 8 new extras, in build order

1. **Week 2, before Day 11 (half a day):** CodeQL, Dependabot, secret scanning + push protection, auto-generated release notes.
2. **Week 2:** `docs/ai-guidelines.md` (guiding peers on safe AI use).
3. **From Day 11:** an AI review pass on every PR, findings recorded; a human reviewer for key PRs.
4. **With ADR-005 and Day 14:** sequence diagrams for login, transfer and account opening.
5. **Auth sprint B and Day 25:** Resilience4j timeouts, retries and a circuit breaker; database-outage tests.
6. **Week 3 (Days 16–17):** end-of-day reconciliation job and daily exposure snapshot.
7. **Days 17 and 20:** `EXPLAIN ANALYZE` for report queries; k6 load test.
8. **Day 25:** engineering health page (latency, errors, slow endpoints, test and CI stats).
