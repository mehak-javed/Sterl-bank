# ADR-004: Exposure and limit utilisation are derived, in integer basis points

- **Status:** Accepted (data model built in CR2; the exposure engine and breach alerts follow in CR3)
- **Date:** 2026-11-12

## Context

The Credit Risk desk answers one question all day: how much does each borrower owe against its credit limit,
and has anyone gone over? A wrong answer either hides a breach (risk) or raises false alarms (noise). Two
classic mistakes cause wrong answers: storing a running "exposure" figure that drifts away from the movements
behind it, and dividing money with floating point, so that exactly 100% becomes 99.99999%.

## Decision

- **Exposure is never stored.** It is the sum of a facility's signed drawdowns and repayments (`drawdowns`
  table, BIGINT pence), the same "derive, don't store" rule as account balances. The database refuses a
  repayment larger than what is owed (checked at commit) and refuses edits to history (append-only).
- **Utilisation is integer basis points:** `exposure_pence * 10000 / limit_pence` (10,000 = 100%), computed in
  `long` in Java and `BIGINT` in SQL. Bands compare integers: under 7,500 fine, 7,500 to 10,000 warning,
  over 10,000 breach.
- **A zero limit** (a cancelled facility) has no utilisation, not a division by zero: `NULLIF(limit, 0)` in
  SQL, an explicit branch in Java, and a dedicated test.
- **A breach is recorded once** (alert, audit entry and a "needs review" item), not on every recalculation; a
  rating downgrade re-checks that counterparty's facilities.

## Consequences

- The numbers always reconcile with the movements behind them, and exactly 100% is exactly 100%.
- Reports read more rows than a stored total would; indexes on `(facility_id, occurred_on)` and
  `EXPLAIN ANALYZE` on each report (CR4) keep that fast at this scale.
- Edge cases (zero limit, exactly 75%, exactly 100%, one penny over, a downgrade) are part of the test plan.
