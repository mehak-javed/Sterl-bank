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
| Nov 10 | Removed build output from git | `git ls-files` shows nothing under `sterl-api/target/` | A manual `git add .` had committed `target/` (a 24 MB jar); untracked it and confirmed `.gitignore` covers it |
