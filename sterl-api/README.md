# sterl-api

The Java back end for Sterl: Spring Boot 4.1 on Java 25 (LTS), built with Maven.

> Sterl is a portfolio demo. Not a real bank. All data is fake.

It will own everything a bank must get right: the double-entry ledger, transfers with
idempotency keys, the audit log, and the credit risk calculations (exposure, limit utilisation,
breaches). Money is always integer pence (`long`), never `double`. See `../docs/adr/`.

## Run it

Needs a JDK 25 (Temurin) and PostgreSQL (on a Mac: [Postgres.app](https://postgresapp.com)).
No Maven install needed: `./mvnw` downloads the right version.

One-time database set-up (Postgres.app's tools; your macOS user, no password):

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb sterl
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb sterl_test
```

```bash
./mvnw verify            # compile + JUnit tests (against sterl_test) + package
./mvnw spring-boot:run   # start on http://localhost:8080 (Flyway migrates the sterl database first)
```

Connection settings come from environment variables (`STERL_DB_URL`, `STERL_DB_USER`,
`STERL_DB_PASSWORD`, and `STERL_TEST_DB_URL` for tests), so no password is ever committed.

## Database

Flyway applies the SQL files in order, once each:

- `db/migration/V1__ledger_schema.sql`: customers, accounts (including the bank's internal
  accounts), payees, the double-entry ledger, the audit log, and the balance/statement views.
- `db/seed/V2__seed_demo_bank.sql`: the fake demo bank, **generated** from the front end's JSON
  fixtures by `npm run seed:sql` (CI fails if it's out of date). Never edit it by hand.

Rules the database enforces itself:

| Rule | How |
| --- | --- |
| Every ledger transaction has 2+ legs summing to exactly 0 | Deferred constraint trigger, checked at commit |
| The ledger and audit log are append-only | Triggers reject `UPDATE`, `DELETE`, `TRUNCATE` |
| Money is whole pence | `BIGINT` columns only; a test fails if any float/money column appears |
| Balances can't drift | No balance column: `account_balances` sums the entries; `account_statement` uses a window function for the running balance |

## Endpoints so far

| Endpoint | What it's for |
| --- | --- |
| `GET /actuator/health` | Is the API up? (`{"status":"UP"}`) |
| `GET /actuator/health/liveness` | Is the process healthy, or should it be restarted? |
| `GET /actuator/health/readiness` | Can it take traffic right now? |
| `GET /actuator/info` | Name and demo disclaimer |
| `GET /api/accounts` | The customer's accounts, balances calculated from the ledger |
| `GET /api/accounts/{id}` | One account (404 if it doesn't exist or isn't the customer's) |
| `GET /api/accounts/{id}/transactions` | The statement, newest first, one page at a time |

Statement query parameters (all optional):

| Parameter | Meaning | Rules |
| --- | --- | --- |
| `category` | Exact category, e.g. `Groceries` | up to 40 characters |
| `kind` | `card`, `salary`, `direct_debit`, `standing_order`, `transfer`, `roundup`, `opening_balance` | one of these |
| `from`, `to` | First and last day to include, e.g. `2026-10-01` | whole UK days (Europe/London); `from` ≤ `to` |
| `q` | Text to find in the description, case-insensitive; `%` and `_` are plain text | up to 50 characters |
| `page`, `size` | Page number from 0; rows per page (default 20) | `page` 0–10,000; `size` 1–100 |

Example: `/api/accounts/{id}/transactions?category=Groceries&from=2026-10-01&to=2026-10-31&size=20`
returns `{items, page, size, totalItems, totalPages}`. Each item's `balanceAfterPence` is the
account's real balance after it, even when filtered.

Errors are RFC 9457 problem details (`application/problem+json`), e.g.
`{"status":400,"title":"Bad Request","detail":"size: must be less than or equal to 100"}`.

Other Actuator endpoints (`env`, `beans`, `heapdump`…) are deliberately not exposed: they would
reveal configuration and internals. A test (`HealthEndpointTests`) keeps it that way.
