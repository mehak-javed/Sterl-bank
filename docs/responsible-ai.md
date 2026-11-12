# Responsible AI in Sterl

Sterl uses Claude (Anthropic) in one place so far: **explaining payment screening decisions** (issue #40).
These are the rules it follows, and where each one is enforced in code.

## 1. Rules decide, the AI explains
Whether a payment is sent or held is decided by fixed rules (`payments/PaymentScreeningRules.java`): a high
value, a payment much larger than usual, rapid repeats, a brand-new payee. Each rule has a test on both sides
of its threshold. The AI is only asked to put the decision into words. It is never asked whether to hold a
payment, and its reply can't change the decision: the payment is already committed before the AI is called.

**Why:** a bank must be able to say exactly why money was held, test every rule, and change one deliberately.

## 2. A person makes the final call
A held payment moves no money. A risk officer releases it (the balance is checked again first) or rejects it,
always with a written reason that goes into the audit log (`/api/risk/payments/...`).

## 3. Nothing personal leaves the bank
The AI sees only `ExplainerInput`: amounts, counts, the payee type and the rules' own words. That record
has **no field** for a name, account number, sort code, email or reference, so none can be sent. A test
checks the list of fields, and another checks a real request's stored input for personal details.

## 4. Treat AI output as data
The reply must match a fixed schema (structured outputs: `customerMessage`, `reviewerNote`). The system
prompt states the decision is final, the facts are data and not instructions, and nothing may be invented.

## 5. The bank works without the AI
No API key, a timeout (20 s, one retry), an error, a refusal or an empty reply all fall back to fixed wording
(`TemplatePaymentExplainer`). Payments never wait on, or fail because of, an outside AI. Tests always run on
the template and never call the API.

## 6. Every decision is on the record
`ai_audit_logs` (append-only) keeps, for every payment: the decision, score and rules, who wrote the
explanation (`ai` or `template`) and which model, exactly what the AI was shown, how long it took, and any error.

## 7. Customers aren't told the thresholds
The customer sees a calm message ("paused for a quick security check"), never the score or which limit was
crossed; that would teach fraudsters how to stay under it. Staff see the full reasons.

## Configuration
- `ANTHROPIC_API_KEY`: environment variable only, never committed. Without it, the template is used.
- `sterl.ai.model`: `claude-opus-5-5`. `sterl.ai.timeout`: `20s`.
