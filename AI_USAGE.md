# AI usage log

Sterl is built with help from Claude Code (an AI coding assistant). This log records what the AI
produced, how I checked it, and what I fixed, because AI output is only as good as its review.

**My rules**
- Every AI-written change gets tests and my own line-by-line review before it's merged.
- No secrets, real personal data or sensitive data in prompts. Sterl's data is all fake (ADR-002).
- The AI's claims are verified: tests, typecheck, build, and checking the app in a browser.
- I write the core logic myself where it matters for learning (e.g. `roundUp`, `toPence`).

## Week 1 (Nov 4–6, 2026)

| Date | What the AI produced | How it was checked | What was found or fixed |
| --- | --- | --- | --- |
| Nov 4 | Next.js set-up, demo banner, `formatGBP` with tests | Vitest, build | — |
| Nov 5 | Test cases for `roundUp` / `toPence`; **I wrote both functions** | 27 Vitest tests | Strict parsing: `toPence(" 12.34 ")` throws instead of trimming |
| Nov 5 | Seeded Faker generator | A built-in reconciliation check | First seed gave a balance of −£9,262; spending ranges and salary corrected |
| Nov 5 | Zustand store, mock API, TanStack Query, optimistic card freeze | Browser test of freeze + rollback | First test was inconclusive (button disabled during refetch); re-tested, exactly 1 request |
| Nov 5 | FX desk (Frankfurter, Redux Toolkit) | Build, browser | Script failed on top-level await in CommonJS; a variable named `URL` hid the global |
| Nov 5 | Black and gold theme, glass panels | Contrast ratios calculated for every text/background pair | Gold text failed WCAG on white (2.1:1); light mode uses deep gold. Glass fallbacks lost a CSS specificity fight; moved |
| Nov 5 | App Router pages, layouts, loading/error | Status codes with curl, browser | `notFound()` returns 200 + `noindex` under Cache Components (documented, not a bug). A page briefly crashed with `Link is not defined` mid-edit |
| Nov 5 | Server Components, Suspense | Server HTML checked for balances | Next 16 instant-navigation warning: `params` read outside Suspense; fixed per the docs |
| Nov 5 | Server actions: transfers with idempotency keys, round-ups switch | Browser: invalid amount, valid transfer, insufficient funds, switch rollback | **Real bug:** API routes and server actions had separate copies of the in-memory bank, so transfers didn't appear in the transaction list. Fixed with one shared copy on `globalThis` |
| Nov 6 | CI workflow, PR template, user stories | Full CI run in a fresh clone | Typecheck needed Next's generated route types first (`next typegen`) |
| Nov 6 | Credit risk page, nav helper with tests | 6 new Vitest tests, browser | Old nav used `startsWith`, so `/cards` would also match `/cardsharp`; now segment-aware |
| Nov 6 | ADR-001, ADR-002, architecture diagram | My review | — |

## Week 2 (from Nov 6, 2026)

| Date | What the AI produced | How it was checked | What was found or fixed |
| --- | --- | --- | --- |
| Nov 6 | Spring Boot API skeleton (Spring Initializr), Actuator health, JUnit tests, Java CI | `./mvnw verify` (6 tests), ran the jar and called every endpoint with curl, CI green | Locked down Actuator so only `health` and `info` are public; a test proves `env`, `beans` and `heapdump` return 404. My first Java install was Oracle Java 8 (a runtime with no compiler); switched to Temurin 25 |
| Nov 10 | Day 9: Flyway schema (double-entry ledger, append-only audit log), seed SQL generator, 12 ledger JUnit tests, PostgreSQL in CI | 18 JUnit tests against real PostgreSQL 18; **mutation check**: disabled the balance trigger on purpose and confirmed 4 tests failed, then restored it; seed generator run twice gives a byte-identical file | Caught my own bad constraint before running it (`code IS NULL IS FALSE` instead of `code IS NOT NULL`). Statement running balances match all 708 front-end transactions |
| Nov 10 | Day 10: accounts and statement REST API (filters, paging, problem-details errors), 17 API tests | 35 JUnit tests; expected numbers come from the front-end fixtures, not typed in; **mutation check**: removed LIKE escaping and confirmed the wildcard test failed; called every endpoint with curl | My first repository draft used a method that doesn't take a map (`paramSource`), fixed to `params` before compiling. Validation errors only said "Validation failure"; added a handler that names the parameter and the rule |
| Nov 10 | Day 11: safe transfers (idempotency keys, row locks in id order, double entry + audit in one transaction), strict JSON for money, 15 transfer tests incl. real concurrency | 50 JUnit tests against PostgreSQL; **two mutation checks**: removing `FOR UPDATE` let all 20 parallel transfers through and overdrew the Round-up Pot to −£138.35 (test failed 3/3 runs); locking in request order instead of id order caused `deadlock detected` (test failed 2/2); called the running API with curl | V1's global `idempotency_key` column was the wrong shape (must be per customer and remember the request), replaced in V3. Found that Jackson would silently turn `12.99` into `12` and accept `"100"`; switched both off and added tests |
| Nov 10 | Auth A1: Spring Security login (Argon2id, sessions in PostgreSQL, CSRF, security headers, failed-login throttling), customers scoped to the logged-in user, 4 extra fake customers, 26 new tests | 76 JUnit tests; **two mutation checks**: removing the customer filter let Tomas read Nikita's account (isolation test failed); disabling CSRF failed the auth tests; logged in with curl against the running API | A test showed the session cookie was missing HttpOnly, Secure and SameSite outside a real Tomcat (Spring Session copies the server's settings); set the cookie explicitly in code so every environment gets the same secure cookie. Also caught: two constructors left Spring unable to create the rate limiter |
| Nov 10 | Dependabot first batch | Checked CI on all 5 PRs; for the two major upgrades that passed, verified by hand (ESLint 10 applies the same 113 rules; TypeScript 6 typechecks and builds) | Rejected a green PR: `@types/node` 26 would let code use APIs missing from the Node 24 runtime. Added ignore rules for it and TypeScript 7 |
| Nov 10 | Extra 1: CodeQL workflow, Dependabot config, release-notes categories, SECURITY.md | Checked the latest action versions on GitHub before pinning (codeql-action v4, checkout v7); parsed every workflow and config file as YAML; CodeQL and Dependabot results verified on GitHub after merge | Existing workflows were on older action versions; left them for Dependabot to bump through CI, as a first real test of the setup |
| Nov 10 | Removed build output from git | `git ls-files` shows nothing under `sterl-api/target/` | A manual `git add .` had committed `target/` (a 24 MB jar); untracked it and confirmed `.gitignore` covers it |
