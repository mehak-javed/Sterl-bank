-- V13: payments to other people (saved payees), screened before any money moves.
--
-- A payment is screened by RULES (PaymentScreeningRules.java). The rules decide:
--   settled  low risk: money moved at once (ledger: customer account -> OUTBOUND_PAYMENTS)
--   held     risky: NOTHING has moved yet; a risk officer releases (then it settles) or rejects it
-- Claude only writes the plain-English explanation of the rules' decision; it never decides.
-- Every decision, and what was (and wasn't) sent to the AI, is kept in ai_audit_logs.

ALTER TABLE ledger_transactions DROP CONSTRAINT ledger_transactions_kind_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_kind_check CHECK (kind IN (
    'opening_balance', 'card', 'direct_debit', 'standing_order', 'salary', 'transfer', 'roundup', 'top_up',
    'payment'));

CREATE TABLE payments (
    id                     UUID        PRIMARY KEY,
    customer_id            UUID        NOT NULL REFERENCES customers (id),
    from_account_id        UUID        NOT NULL REFERENCES accounts (id),
    payee_id               UUID        NOT NULL REFERENCES payees (id),
    amount_pence           BIGINT      NOT NULL CHECK (amount_pence > 0),
    reference              TEXT        CHECK (char_length(reference) <= 18),
    status                 TEXT        NOT NULL CHECK (status IN ('settled', 'held', 'released', 'rejected')),
    risk_score             INTEGER     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    -- The rules that fired, e.g. {LARGE_FOR_THIS_CUSTOMER,VELOCITY}. Empty for a clean payment.
    rule_hits              TEXT[]      NOT NULL DEFAULT '{}',
    -- Set once money has really moved (at once when settled; on release when held).
    ledger_transaction_id  UUID        REFERENCES ledger_transactions (id) DEFERRABLE INITIALLY DEFERRED,
    -- Exactly-once, like transfers: the same key from the same customer never pays twice.
    idempotency_key        TEXT        NOT NULL,
    request_hash           TEXT        NOT NULL,
    reviewed_by            TEXT,
    review_note            TEXT        CHECK (char_length(review_note) <= 500),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at             TIMESTAMPTZ,
    CONSTRAINT payments_idempotency UNIQUE (customer_id, idempotency_key),
    -- Money has moved exactly when the payment is settled or released.
    CONSTRAINT payments_money_moved_matches_status CHECK (
        (status IN ('settled', 'released')) = (ledger_transaction_id IS NOT NULL))
);

CREATE INDEX payments_customer_idx ON payments (customer_id, created_at DESC);
-- The risk officers' queue: held payments, oldest first. A partial index stays tiny.
CREATE INDEX payments_held_idx ON payments (created_at) WHERE status = 'held';

CREATE TABLE ai_audit_logs (
    id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id       UUID        NOT NULL REFERENCES payments (id),
    decision         TEXT        NOT NULL CHECK (decision IN ('approve', 'hold')),
    risk_score       INTEGER     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    rule_hits        TEXT[]      NOT NULL,
    -- Who wrote the explanation: the AI model, or the built-in template (AI off, failed or not needed).
    explained_by     TEXT        NOT NULL CHECK (explained_by IN ('ai', 'template')),
    model            TEXT,
    customer_message TEXT        NOT NULL,
    reviewer_note    TEXT        NOT NULL,
    -- Exactly what the AI was shown: redacted facts only (no names, account numbers or sort codes).
    ai_input         JSONB       NOT NULL,
    latency_ms       INTEGER     NOT NULL CHECK (latency_ms >= 0),
    error            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_audit_logs_payment_idx ON ai_audit_logs (payment_id, created_at DESC);

-- What the AI was told and said is evidence: append-only (function from V1).
CREATE TRIGGER ai_audit_logs_append_only
    BEFORE UPDATE OR DELETE ON ai_audit_logs
    FOR EACH ROW EXECUTE FUNCTION reject_change_to_append_only_table();
CREATE TRIGGER ai_audit_logs_no_truncate
    BEFORE TRUNCATE ON ai_audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION reject_change_to_append_only_table();
