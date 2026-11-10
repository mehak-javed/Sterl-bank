# ADR-001: Store all money as integer pence

- **Status:** Accepted
- **Date:** 2026-11-04

## Context

A bank's first job is to never get money wrong. JavaScript numbers are binary floating point,
which can't represent most decimal amounts exactly: `0.1 + 0.2` is `0.30000000000000004`.
Add up thousands of transactions, or convert currencies, and those tiny errors become wrong
balances that don't reconcile. Java's `double` has the same problem.

The Credit Risk desk makes this more important: limit utilisation decides whether a
counterparty is in breach, so a rounding error at exactly 100% could hide a breach.

## Decision

Every amount of money is an **integer number of pence** (`1234` = £12.34), everywhere:

- TypeScript: the `Pence` type in `src/lib/money.ts`, checked with `Number.isSafeInteger`
  (`assertPence`). Safe integers go up to about £90 trillion, far beyond any amount Sterl needs.
- Java (from week 2): `long`, never `double` or `float`. `BigDecimal` only where a rate
  (FX, percentage) is involved, rounded once, at the end, with an explicit rounding mode.
- PostgreSQL (from week 2): `BIGINT` columns, never `REAL`, `DOUBLE PRECISION` or `MONEY`.
- Pounds appear only at the edge, for display: `formatGBP` builds the decimal string with
  integer maths and never goes through a float.
- User input is parsed with `toPence`, which works on the string ("12.34" → 1234) and rejects
  anything with more than two decimal places instead of guessing.
- Foreign currency uses that currency's minor unit (JPY has none, so ¥ amounts are whole yen),
  and a conversion rounds exactly once (`convertFromPence` in `src/lib/fx.ts`).

## Consequences

- Totals and transfers are exact: every transfer's two ledger legs sum to exactly zero, and the
  seed generator reconciles every balance.
- Every money function fails loudly on a non-integer instead of silently showing a wrong number.
- Developers must remember to convert at the edges. The helpers and their tests
  (`src/lib/money.test.ts`) make the right way the easy way.
- Percentages such as limit utilisation are computed from integers, and the band boundaries
  (75%, 100%) are compared without floats (e.g. `exposure * 100 > limit * 75`).
