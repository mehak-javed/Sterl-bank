# ADR-003: A Java + Spring Boot API owns the money; Next.js is the front door

- **Status:** Accepted
- **Date:** 2026-11-10 (front end switched over 2026-11-12)

## Context

Week 1 ran everything inside Next.js: route handlers over an in-memory store. That proved the screens, but a
bank's rules (a balanced ledger, exactly-once payments, who may see what) must live in one trusted place that
every screen, test and future channel goes through. The target role is Java first, and banks run their core
on typed, well-tested JVM services over a relational database.

## Decision

- **`sterl-api`** (Java 25, Spring Boot 4) is the only thing that reads or changes customer data. It talks to
  PostgreSQL with hand-written SQL (`JdbcClient`, no ORM), so every query is visible, reviewable and testable.
- **Next.js stays the front door.** The browser only calls the website's own address; `next.config.ts`
  rewrites `/api/{auth,accounts,cards,transfers,payees,payments,risk}/*` to the API, and Server Components call
  it on the server with the visitor's session cookie (`src/server/sterl-api.ts`).
- The website keeps no copy of customer data: the week-1 mock routes and in-memory bank were deleted.
- Money-moving operations require an `Idempotency-Key` and run in one database transaction that locks the
  accounts involved in a fixed order.

## Consequences

- Same-origin requests: the session cookie is first-party and HttpOnly, and no CORS rules are needed.
- One source of truth, tested with JUnit against a real PostgreSQL (including concurrency and isolation tests).
- Two runtimes to deploy: the website on Vercel, the API plus PostgreSQL on a container host. The website
  needs `STERL_API_URL`; until the API is deployed, the live site's banking pages can't log in.
- Behind the website, the API sees the website's address, not the visitor's: deployment must trust the
  forwarded visitor address only from the website (otherwise the login rate limit would count everyone together).
