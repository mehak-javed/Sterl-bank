-- =====================================================================================
-- V1: Sterl's core banking schema.
--
-- Flyway runs each V<n>__*.sql file once, in order, and records it in flyway_schema_history.
-- Never edit a migration that has already run anywhere: add a new V<n+1> file instead.
--
-- Money is always BIGINT pence (ADR-001). Never REAL, DOUBLE PRECISION or MONEY.
-- All data is fake (ADR-002).
-- =====================================================================================

-- ---------- Customers ----------

CREATE TABLE customers (
    id          UUID        PRIMARY KEY,
    first_name  TEXT        NOT NULL,
    last_name   TEXT        NOT NULL,
    email       TEXT        NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Accounts ----------
-- Customer accounts (current, saver, round-up pot) AND the bank's own internal accounts.
-- Internal accounts hold the other side of money that enters or leaves Sterl
-- (card spending, salaries, direct debits), so every movement can be double-entry.

CREATE TABLE accounts (
    id              UUID        PRIMARY KEY,
    customer_id     UUID        REFERENCES customers (id),
    type            TEXT        NOT NULL CHECK (type IN ('current', 'saver', 'roundup', 'internal')),
    code            TEXT        UNIQUE,           -- internal accounts only, e.g. 'CARD_SETTLEMENT'
    name            TEXT        NOT NULL,
    sort_code       TEXT        CHECK (sort_code ~ '^\d{2}-\d{2}-\d{2}$'),
    account_number  TEXT        CHECK (account_number ~ '^\d{8}$'),
    currency        CHAR(3)     NOT NULL DEFAULT 'GBP' CHECK (currency = 'GBP'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A customer account has an owner and bank details; an internal account has a code and neither.
    CONSTRAINT accounts_owner_matches_type CHECK (
        (type = 'internal'  AND customer_id IS NULL     AND code IS NOT NULL
                            AND sort_code IS NULL       AND account_number IS NULL)
        OR
        (type <> 'internal' AND customer_id IS NOT NULL AND code IS NULL
                            AND sort_code IS NOT NULL   AND account_number IS NOT NULL)
    ),
    CONSTRAINT accounts_bank_details_unique UNIQUE (sort_code, account_number)
);

CREATE INDEX accounts_customer_idx ON accounts (customer_id);

-- The bank's internal accounts. Fixed ids, so seed data and code can refer to them.
INSERT INTO accounts (id, type, code, name) VALUES
    ('00000000-0000-4000-8000-000000000001', 'internal', 'OPENING_BALANCES',  'Opening balances'),
    ('00000000-0000-4000-8000-000000000002', 'internal', 'CARD_SETTLEMENT',   'Card scheme settlement'),
    ('00000000-0000-4000-8000-000000000003', 'internal', 'INBOUND_PAYMENTS',  'Inbound payments (salary, Faster Payments)'),
    ('00000000-0000-4000-8000-000000000004', 'internal', 'OUTBOUND_PAYMENTS', 'Outbound payments (direct debits, standing orders)');

-- ---------- Payees ----------

CREATE TABLE payees (
    id              UUID        PRIMARY KEY,
    customer_id     UUID        NOT NULL REFERENCES customers (id),
    name            TEXT        NOT NULL,
    type            TEXT        NOT NULL CHECK (type IN ('person', 'business')),
    sort_code       TEXT        NOT NULL CHECK (sort_code ~ '^\d{2}-\d{2}-\d{2}$'),
    account_number  TEXT        NOT NULL CHECK (account_number ~ '^\d{8}$'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT payees_unique_per_customer UNIQUE (customer_id, sort_code, account_number)
);

-- ---------- The double-entry ledger ----------
-- One ledger_transaction = one real-world event (a card payment, a transfer...).
-- Each has two or more ledger_entries (legs), one per account touched, and the legs
-- ALWAYS sum to zero: money moves, it is never created or destroyed.
--
-- There is no balance column anywhere. A balance is SUM(amount_pence) of an account's entries,
-- so it can never drift out of step with the ledger.

CREATE TABLE ledger_transactions (
    id               UUID        PRIMARY KEY,
    kind             TEXT        NOT NULL CHECK (kind IN (
                         'opening_balance', 'card', 'direct_debit', 'standing_order',
                         'salary', 'transfer', 'roundup')),
    description      TEXT        NOT NULL,
    category         TEXT        NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    -- Set for payments the customer makes (Day 11): the same key twice = the same payment, once.
    idempotency_key  TEXT        UNIQUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
    id                     UUID        PRIMARY KEY,
    ledger_transaction_id  UUID        NOT NULL REFERENCES ledger_transactions (id),
    account_id             UUID        NOT NULL REFERENCES accounts (id),
    -- Signed, from this account's point of view: negative = money out, positive = money in.
    amount_pence           BIGINT      NOT NULL CHECK (amount_pence <> 0),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ledger_entries_account_idx       ON ledger_entries (account_id);
CREATE INDEX ledger_entries_transaction_idx   ON ledger_entries (ledger_transaction_id);
CREATE INDEX ledger_transactions_occurred_idx ON ledger_transactions (occurred_at DESC, id DESC);

-- Rule 1: every ledger transaction balances.
-- A CONSTRAINT TRIGGER that is DEFERRABLE INITIALLY DEFERRED runs at COMMIT, not after each row:
-- inside a database transaction the legs are inserted one by one (unbalanced for a moment),
-- and only the finished result has to balance. If it doesn't, the whole commit is rejected.
CREATE FUNCTION assert_ledger_transaction_balanced() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    tx_id UUID;
    total BIGINT;
    legs  INT;
BEGIN
    IF TG_TABLE_NAME = 'ledger_entries' THEN
        tx_id := NEW.ledger_transaction_id;
    ELSE
        tx_id := NEW.id;
    END IF;

    SELECT COALESCE(SUM(amount_pence), 0), COUNT(*)
      INTO total, legs
      FROM ledger_entries
     WHERE ledger_transaction_id = tx_id;

    IF legs < 2 OR total <> 0 THEN
        RAISE EXCEPTION 'Ledger transaction % is unbalanced: % entries summing to % pence', tx_id, legs, total
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER ledger_entries_balanced
    AFTER INSERT ON ledger_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_ledger_transaction_balanced();

-- Also catches a ledger transaction saved with no entries at all.
CREATE CONSTRAINT TRIGGER ledger_transactions_balanced
    AFTER INSERT ON ledger_transactions
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_ledger_transaction_balanced();

-- ---------- Audit log ----------
-- Who did what, to what, and when. Regulators rely on it, so like the ledger it is append-only.

CREATE TABLE audit_log (
    id           BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor        TEXT        NOT NULL,             -- who: a user id, or 'system'
    action       TEXT        NOT NULL,             -- what: 'transfer.created', 'card.frozen'...
    entity_type  TEXT        NOT NULL,             -- to what kind of thing: 'account', 'card'...
    entity_id    TEXT        NOT NULL,
    details      JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, occurred_at DESC);

-- Rule 2: the ledger and the audit log are append-only.
-- No UPDATE, DELETE or TRUNCATE. A mistake is corrected by a NEW reversing entry, so the history
-- of what happened is never lost: that is what auditors expect.
CREATE FUNCTION reject_change_to_append_only_table() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% is append-only: % is not allowed. Record a new reversing entry instead.', TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER ledger_transactions_append_only
    BEFORE UPDATE OR DELETE ON ledger_transactions
    FOR EACH ROW EXECUTE FUNCTION reject_change_to_append_only_table();
CREATE TRIGGER ledger_transactions_no_truncate
    BEFORE TRUNCATE ON ledger_transactions
    FOR EACH STATEMENT EXECUTE FUNCTION reject_change_to_append_only_table();

CREATE TRIGGER ledger_entries_append_only
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION reject_change_to_append_only_table();
CREATE TRIGGER ledger_entries_no_truncate
    BEFORE TRUNCATE ON ledger_entries
    FOR EACH STATEMENT EXECUTE FUNCTION reject_change_to_append_only_table();

CREATE TRIGGER audit_log_append_only
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION reject_change_to_append_only_table();
CREATE TRIGGER audit_log_no_truncate
    BEFORE TRUNCATE ON audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION reject_change_to_append_only_table();

-- ---------- Views: balances and statements, calculated from the ledger ----------

-- Current balance of every account (accounts with no entries show 0).
CREATE VIEW account_balances AS
SELECT a.id                                  AS account_id,
       COALESCE(SUM(e.amount_pence), 0)::BIGINT AS balance_pence
  FROM accounts a
  LEFT JOIN ledger_entries e ON e.account_id = a.id
 GROUP BY a.id;

-- A bank statement: every entry with the balance straight after it.
-- SUM(...) OVER (...) is a WINDOW FUNCTION: a running total per account, in time order,
-- calculated by the database instead of stored (so it can't be wrong).
CREATE VIEW account_statement AS
SELECT e.id                    AS entry_id,
       e.account_id,
       t.id                    AS ledger_transaction_id,
       t.occurred_at,
       t.kind,
       t.description,
       t.category,
       e.amount_pence,
       SUM(e.amount_pence) OVER (
           PARTITION BY e.account_id
           ORDER BY t.occurred_at, e.id
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       )::BIGINT               AS balance_after_pence
  FROM ledger_entries e
  JOIN ledger_transactions t ON t.id = e.ledger_transaction_id;
