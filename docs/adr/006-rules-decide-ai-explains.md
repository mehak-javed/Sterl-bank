# ADR-006: In payment screening, rules decide and the AI only explains

- **Status:** Accepted
- **Date:** 2026-11-12

## Context

Payments to other people are screened before money moves. A language model could score them, but a bank must
explain exactly why a payment was held, test every threshold, change a rule deliberately, and keep paying
customers when an outside service is slow or down. Customer data must not be sent to third parties.

## Decision

- **Fixed rules decide** (`PaymentScreeningRules`): high value, much larger than usual, rapid repeats, new payee;
  a score of 50 or more holds the payment. Pure functions, every threshold tested on both sides.
- **A person makes the final call** on a held payment (release, after the balance is checked again, or reject),
  always with a reason in the audit log.
- **The AI writes words only**, after the decision is committed: a calm message for the customer and a note for
  the risk officer, via Anthropic's Java SDK with a structured-output schema. Its input is an allow-list record
  with no field for names, account numbers or sort codes.
- **Off by default** (`STERL_AI_ENABLED`): fixed wording is used unless the feature is switched on and a key is
  present; any timeout, error or refusal also falls back to fixed wording.
- **Everything is on the record** in the append-only `ai_audit_logs` table, including exactly what the AI saw.

## Consequences

- Decisions are deterministic, explainable and testable; the AI can't approve or block a payment.
- Payments never wait on the AI and never fail because of it.
- See [docs/responsible-ai.md](../responsible-ai.md) for the full guardrails.
