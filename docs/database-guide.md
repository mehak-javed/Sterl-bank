# Looking inside Sterl's database

How to open your local PostgreSQL, find your own account's data, and measure how fast the queries are.
Everything here is **local** (your Mac's Postgres.app). Nothing touches the live site.

## 1. Start the API once, so the database is up to date

The API runs Flyway when it starts: any new migration (e.g. `V6__cards.sql`) is applied to the `sterl` database.

```bash
cd sterl-api
STERL_COOKIE_SECURE=false ./mvnw spring-boot:run
```

`STERL_COOKIE_SECURE=false` only because the local site runs on plain `http://`; the live API keeps secure cookies.
Then start the website in a second terminal (`npm run dev`), open http://localhost:3000/signup and open **your own
account**. Use your real first name if you like, but an `@example.com` email (e.g. `mehak@example.com`), so
screenshots never show a real address.

## 2. Open the database

**Easiest:** open Postgres.app, then double-click the **sterl** database. A terminal opens with `psql` connected.

**From any terminal:**

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -d sterl
```

(Optional: add that `bin` folder to your PATH in `~/.zshrc` so plain `psql -d sterl` works.)

**With a visual app** (tables you can click through): pgAdmin, TablePlus or Postico. Connection details:

| Setting  | Value                |
|----------|----------------------|
| Host     | `localhost`          |
| Port     | `5432`               |
| Database | `sterl`              |
| User     | your macOS user name |
| Password | (none)               |

Handy `psql` commands: `\dt` lists tables, `\dv` views, `\d cards` describes a table, `\x` switches to
one-column-per-line output for wide rows, `\q` quits.

## 3. Find your own data

Set your email once, then every query below uses it:

```sql
\set email 'mehak@example.com'
```

```sql
-- You: login, role, when you joined and last logged in. (Your password is only an Argon2id hash,
-- and your name shows as enc:v1:... because it is stored encrypted: see "What is encrypted" below.)
SELECT u.email, u.role, c.first_name, c.last_name, u.created_at, u.last_login_at
  FROM app_users u JOIN customers c ON c.id = u.customer_id
 WHERE u.email = :'email';

-- Your accounts and balances. Balances are never stored: the account_balances view adds up the ledger.
SELECT a.name, a.sort_code, a.account_number, b.balance_pence,
       to_char(b.balance_pence / 100.0, 'FM£999,999,990.00') AS balance
  FROM accounts a
  JOIN account_balances b ON b.account_id = a.id
  JOIN app_users u ON u.customer_id = a.customer_id
 WHERE u.email = :'email';

-- Your latest payments, with the running balance (a window function in the account_statement view).
-- Each card you add has its own account (e.g. "Travel Card"), so its payments show here too.
SELECT a.name AS account, s.occurred_at::date AS day, s.description, s.amount_pence, s.balance_after_pence
  FROM account_statement s
  JOIN accounts a ON a.id = s.account_id
  JOIN app_users u ON u.customer_id = a.customer_id
 WHERE u.email = :'email'
 ORDER BY s.occurred_at DESC LIMIT 20;

-- Your cards and the account each one spends from. The name on the card, last 4 digits and expiry
-- are ONE encrypted value (details_encrypted). No full number, CVV or PIN is ever stored.
SELECT k.product, k.brand, a.name AS account, k.frozen, left(k.details_encrypted, 30) AS details_encrypted
  FROM cards k
  JOIN accounts a ON a.id = k.account_id
  JOIN app_users u ON u.customer_id = a.customer_id
 WHERE u.email = :'email';

-- Everything you did: logins, sign-up, transfers, cards added, frozen, unfrozen.
SELECT occurred_at, action, entity_type, details
  FROM audit_log
 WHERE actor IN (SELECT 'customer:' || customer_id FROM app_users WHERE email = :'email')
    OR entity_id = :'email'
 ORDER BY occurred_at DESC LIMIT 20;

-- Who is logged in right now (sessions end after 1 hour idle = 3600 seconds).
SELECT principal_name, to_timestamp(last_access_time / 1000) AS last_used, max_inactive_interval
  FROM spring_session;
```

Money is in **integer pence**: `122500` is £1,225.00.

## 4. Measure performance

**How long a query takes:** type `\timing on`, and `psql` prints `Time: 0.7 ms` after every query.

**Why it takes that long:** put `EXPLAIN (ANALYZE, BUFFERS)` in front of a query. PostgreSQL really runs it and
shows its plan, with the real time of each step:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM account_statement
 WHERE account_id = (SELECT a.id FROM accounts a JOIN app_users u ON u.customer_id = a.customer_id
                      WHERE u.email = :'email' AND a.name = 'Everyday Account')
 ORDER BY occurred_at DESC LIMIT 20;
```

How to read it (from the inside out, bottom to top):

- `actual time=0.39..0.62`: milliseconds to the first row and to the last row of that step.
- `rows=617`: rows that step really produced. Compare with the estimate in `cost=... rows=616`; a big gap means
  PostgreSQL's statistics are stale (`ANALYZE;` refreshes them).
- `Seq Scan` reads the whole table; `Index Scan` jumps straight to the rows. With only ~1,300 ledger rows a
  Seq Scan is the **right** choice: reading a few pages beats using an index. Indexes start to win at tens of
  thousands of rows.
- `Buffers: shared hit=23`: 23 pages (8 kB each) read from memory, none from disk.
- `Execution Time`: the total. Measured on Nikita's account (617 payments): **0.7 ms**.

What to try with your own account: make some transfers and freeze/unfreeze a card on the website, then re-run
the queries above and watch new rows appear in the statement and the audit log.

Bigger performance tests come later in the plan: `EXPLAIN ANALYZE` on the credit-risk reports with 2,000+
facilities (Day 17) and a k6 load test against the API (Day 20).

## 5. What is encrypted, and why not everything

| Data | In the database | Why |
|---|---|---|
| Names (`customers.first_name`, `last_name`) | `enc:v1:...` (AES-256-GCM) | Personal data nobody needs to read in SQL |
| Card details (`cards.details_encrypted`: name on card, last 4, expiry) | `enc:v1:...` | Card data is the most sensitive thing a bank holds |
| Passwords | Argon2id hash | Can't be reversed at all, even by Sterl |
| Email | Plain | Login must look people up by it (next step: store a keyed hash for lookup, encrypt the rest) |
| Balances, amounts, dates | Plain | PostgreSQL must add them up for balances and statements; protected by access control and, on a server, disk encryption |

The key is **not** in the database or the repository. On your laptop the API creates `~/.sterl/data-key` the
first time it starts (readable only by you). **Don't delete that file**: without it, the encrypted values in
your local database can't be read again. On a server the key comes from the `STERL_DATA_KEY` setting.

Every encrypted value is tied to its row: copy one customer's encrypted name onto another customer's row and
decryption fails rather than showing it (the row id is the GCM "associated data").

## 6. Rules the database enforces (so you can't break it by accident)

- `ledger_entries`, `ledger_transactions` and `audit_log` are **append-only**: `UPDATE` and `DELETE` are refused.
  Money is corrected by a new reversing entry, the way banks do it.
- Every ledger transaction must balance to zero, checked at commit.
- A card's network must match its product, and a card can only hang off a customer account.
- Names and card details can only be stored encrypted (a CHECK refuses plain values).

**Starting over** (deletes all local data, then the API rebuilds and re-seeds it on the next start):

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/dropdb sterl
```
```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb sterl
```
