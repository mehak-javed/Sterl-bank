-- =====================================================================================
-- V3: idempotency for customer payments (Day 11, "Safe transfers").
--
-- A new migration instead of editing V1: V1 has already run on every database (dev, CI, and
-- later production). Flyway would refuse an edited V1 (checksum mismatch), and that's the point.
-- =====================================================================================

-- V1 put a global UNIQUE idempotency_key on ledger_transactions. That turned out to be the wrong
-- shape: keys must be unique per CUSTOMER (two customers can pick the same key), and we must also
-- remember WHAT was asked, so a reused key with a different request can be rejected. Both live in
-- a table of their own, so the column goes. (Dropping a column isn't a row UPDATE, so the
-- append-only trigger doesn't block it.)
ALTER TABLE ledger_transactions DROP COLUMN idempotency_key;

CREATE TABLE idempotency_records (
    customer_id            UUID        NOT NULL REFERENCES customers (id),
    idempotency_key        TEXT        NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_-]{8,64}$'),
    -- SHA-256 of the request body. Same key + different hash = the caller reused a key by mistake.
    request_hash           TEXT        NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
    -- The ledger transaction this request created. DEFERRABLE: the record is inserted FIRST (that's
    -- what makes a concurrent duplicate wait), and the ledger transaction a moment later, in the
    -- same database transaction. The reference is checked at commit, when both exist.
    ledger_transaction_id  UUID        NOT NULL UNIQUE REFERENCES ledger_transactions (id)
                                       DEFERRABLE INITIALLY DEFERRED,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (customer_id, idempotency_key)
);

COMMENT ON TABLE idempotency_records IS
    'One row per payment request a customer made. A real bank expires these after about 24 hours.';
