# Sterl user stories

Each story becomes one GitHub issue on the Sterl Projects board, then one branch and one pull request.
Format: "As a [who], I want [what] so that [why]", plus acceptance criteria (how we know it's done).

Labels: `week-1` … `week-4`, and `frontend`, `backend`, `risk`, `fx`, `process`, `security`, `ai`.

---

## Week 1: front end on fake data, CI from day one

### 1. Money is always exact ✅
As a customer, I want every amount to be exact to the penny so that I can trust my balance.
- [x] Money is stored as integer pence, never floats
- [x] `formatGBP`, `roundUp`, `toPence` and `sumPence` are covered by Vitest tests
- [x] Invalid amounts (e.g. `12.345`, `3.5` pence) throw instead of guessing

### 2. A seeded fake bank ✅
As a developer, I want the same fake bank every run so that tests and screenshots never change by surprise.
- [x] Faker with `seed(42)` and a fixed reference date
- [x] 3 accounts, 500+ transactions, payees, a test card (4242)
- [x] Transfer legs always sum to zero; balances reconcile

### 3. CI on every change
As a team, we want every pull request checked automatically so that broken code never reaches `main`.
- [ ] GitHub Actions runs lint, typecheck, tests and build on every PR and push to `main`
- [ ] A PR template with the bank checklist
- [ ] CI status badge in the README

### 4. Dashboard and pages ✅
As a customer, I want a dashboard and clear pages so that I can find my money quickly.
- [x] Dashboard, account detail, transactions, cards, markets pages
- [x] Loading, error and not-found screens
- [x] Keyboard nav: skip link, `aria-current` on the active page

### 5. Credit Risk page in the navigation
As a risk officer, I want a Credit Risk page in the navigation so that I can reach the risk desk.
- [ ] "Credit risk" link in the main nav, active state tested
- [ ] Page explains what's coming (counterparties, exposure, breaches)

### 6. Week 1 review and release v0.1
As a reviewer, I want the key decisions written down so that I understand why Sterl is built this way.
- [ ] ADR-001 integer pence, ADR-002 fake data only
- [ ] Architecture diagram in `docs/architecture.md`
- [ ] `AI_USAGE.md` started
- [ ] Deployed to Vercel; tag `v0.1`

## Week 2: Java + Spring Boot + PostgreSQL

### 7. Java API skeleton
As a developer, I want a Spring Boot API with a health check so that the front end has a real backend to call.
- [ ] `sterl-api` project, `GET /health` returns 200
- [ ] JUnit set up; a Java job added to CI

### 8. Ledger database
As the bank, I want a double-entry ledger in PostgreSQL so that money is never created or lost.
- [ ] Flyway migrations: accounts, ledger entries, payees, audit log
- [ ] Seeded from the Faker JSON
- [ ] Every transfer's entries sum to zero (checked by a query and a test)

### 9. Accounts and transactions API
As a customer, I want to filter and page through my transactions so that I can find a payment fast.
- [ ] `GET /accounts`, `GET /accounts/{id}/transactions?category=&from=&to=&page=`
- [ ] Filtering and pagination written in SQL

### 10. Safe transfers
As a customer, I want a transfer to happen exactly once so that a double-click never pays twice.
- [ ] `POST /transfers` with an `Idempotency-Key` header
- [ ] Same key twice → same result, money moved once (JUnit proves it)
- [ ] Insufficient funds rejected; balanced ledger entries

### 11. Send money with a name check
As a customer, I want to be warned if the payee's name doesn't match so that I don't pay the wrong person.
- [ ] React Hook Form + Zod form with a review step
- [ ] Simulated payee name check: match, close match, no match
- [ ] Front end switched from mock routes to the Java API

### 12. Audit log
As a regulator, I want a record of who did what and when so that every sensitive action can be checked.
- [ ] Transfers, card freezes and setting changes write an audit entry
- [ ] Audit trail page lists them

## Week 3: Credit Risk desk + FX desk

### 13. Fake counterparties and facilities
As a risk officer, I want realistic fake borrowers so that the risk desk has data to analyse.
- [ ] 500 fictional companies with sector, country and rating (AAA–CCC), never real names
- [ ] 2,000+ facilities (term loans, revolving credit) with limits in pence, daily drawdowns

### 14. Exposure and limit breaches
As a risk officer, I want exposure and limit utilisation calculated exactly so that no breach goes unnoticed.
- [ ] Java `ExposureService`: exposure = sum of drawn amounts; utilisation = exposure ÷ limit
- [ ] Bands: under 75% fine, 75–100% warning, over 100% breach
- [ ] JUnit edge cases: zero limit, exactly 100%, a rating downgrade
- [ ] A breach creates an alert, an audit entry and a "needs review" item

### 15. Risk reports
As a risk officer, I want standard reports so that I can see where the bank's risk is concentrated.
- [ ] SQL: top 10 exposures, breaches this week, exposure by sector and by rating (JOIN, GROUP BY, window functions)
- [ ] Exposed as API endpoints

### 16. Credit risk dashboard
As a risk officer, I want one screen with every counterparty so that I can spot problems fast.
- [ ] AG Grid with utilisation bars, sorting and filtering
- [ ] Counterparty drill-down page; concentration charts; CSV export; breach alerts

### 17. Live FX desk
As a trader, I want prices that tick in real time so that I can watch the market.
- [ ] Price simulator streams 30+ pairs several times a second (SSE or WebSocket)
- [ ] AG Grid with batched updates stays smooth; labelled "Simulated prices, not for trading"

### 18. Tests for the key journeys
As a team, we want the critical journeys tested so that refactoring is safe.
- [ ] React Testing Library: send money form, risk grid
- [ ] Playwright: send money end to end, breach review end to end
- [ ] Lighthouse 90+ and an accessibility audit; tag `v0.3`

## Week 4: secure, AI, cloud, launch

### 19. Secure login
As a customer, I want a secure login so that only I can see my accounts.
- [ ] Spring Security login with two-factor authentication for demo users
- [ ] Roles: customer, risk officer, admin

### 20. Ask Sterl
As a customer, I want to ask questions about my spending so that I understand my money.
- [ ] Answers only from an allow-list of fake fields; questions treated as untrusted input
- [ ] Answers checked against SQL results; `docs/responsible-ai.md`

### 21. Cloud and observability
As the bank, we want the API running in the cloud with monitoring so that problems are found fast.
- [ ] Docker image for the API; API + PostgreSQL on AWS free tier with a budget alert
- [ ] Structured logs, health checks, error tracking, an alert on API errors

### 22. Launch v1.0
As a recruiter, I want a clear README and a live link so that I can understand Sterl in five minutes.
- [ ] Security pass: dependency audit, secrets scan; `AI_USAGE.md` complete
- [ ] README: screenshots, architecture, CI badge, "Bank thinking", "Data and regulation"
- [ ] Tag `v1.0`; 5-minute walkthrough video
