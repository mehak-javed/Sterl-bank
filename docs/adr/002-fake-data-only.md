# ADR-002: Use 100% fake data

- **Status:** Accepted
- **Date:** 2026-11-04

## Context

Sterl is a public portfolio demo. Real banking needs FCA authorisation as soon as you hold
customers' money, read their real accounts or start real payments, and real personal data
brings UK GDPR duties. A demo needs none of that risk, but it still has to feel realistic
enough to show how a bank's software behaves.

## Decision

Sterl never handles real customers, real money, real accounts or real companies.

| Data | Source |
| --- | --- |
| Customers, accounts, transactions, payees | Our own generator (`src/mocks/generate.ts`) using Faker.js with `faker.seed(42)` and a fixed reference date, saved as JSON fixtures |
| Corporate borrowers and facilities (Credit Risk desk) | The same seeded generator; invented company names only, never real ones |
| Bank API | Our own Next.js route handlers (week 1), then our own Java API over PostgreSQL seeded from the same data (week 2) |
| API responses in tests | MSW handlers for the same URLs |
| FX reference rates | Frankfurter's free public central-bank rates, cached daily, with a saved fallback file |
| Live FX prices | Our own random-walk simulator, labelled "Simulated prices, not for trading" |
| Cards | Published test numbers only (4242 4242 4242 4242) |
| Payee name check | Simulated against our fake payee list (the real Confirmation of Payee is only for regulated firms) |
| Ask Sterl (AI) | Reads only an allow-list of fake fields |
| Open banking (optional) | TrueLayer or Plaid sandbox only, never live mode |

Every page shows, at its foot: "Sterl is a portfolio demo. Not a real bank. All data is fake." (A strip at the top until Nov 10, 2026.)
Visitors are never asked for real names, card numbers, bank logins or money.

## Consequences

- No regulator, licence or third-party approval is needed, and there is no personal data to protect.
- The seed makes the data identical on every run, so tests and screenshots are stable.
- Failure is simulated on purpose (random delays, 1 in 20 requests fails) so loading, error and
  retry states are real, not theoretical.
- The README explains what a real launch would need (FCA authorisation, a real ledger, real
  Confirmation of Payee). Knowing that gap is part of thinking like a bank.
- Secrets still matter: API keys (e.g. for Ask Sterl) live in environment variables, never in git.
