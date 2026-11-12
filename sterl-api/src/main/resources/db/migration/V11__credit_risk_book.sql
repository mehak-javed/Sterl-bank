-- V11: the bank's corporate lending book, for the Credit Risk desk.
--
--   counterparties  the companies Sterl lends to (invented names), with sector, country and credit rating
--   facilities      each loan agreement: a term loan or a revolving credit line, with a credit LIMIT
--   drawdowns       every movement on a facility: money drawn (+) or repaid (-), in time order
--
-- Exposure is never stored: it is the SUM of a facility's drawdowns, the same "derive, don't store"
-- rule as account balances (a stored number could drift away from the movements behind it).
-- All money is BIGINT pence. Limits up to £92 quadrillion fit; floats never appear.

CREATE TABLE counterparties (
    id          UUID        PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    sector      TEXT        NOT NULL CHECK (sector IN (
                    'Manufacturing', 'Retail', 'Real estate', 'Energy', 'Technology', 'Healthcare',
                    'Transport and logistics', 'Hospitality', 'Construction', 'Agriculture')),
    country     CHAR(2)     NOT NULL CHECK (country ~ '^[A-Z]{2}$'),     -- ISO 3166 code, e.g. GB
    -- Credit rating, best to worst. AAA..BBB is "investment grade"; BB and below is "high yield".
    rating      TEXT        NOT NULL CHECK (rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX counterparties_sector_idx ON counterparties (sector);
CREATE INDEX counterparties_rating_idx ON counterparties (rating);

CREATE TABLE facilities (
    id               UUID    PRIMARY KEY,
    counterparty_id  UUID    NOT NULL REFERENCES counterparties (id),
    type             TEXT    NOT NULL CHECK (type IN ('term_loan', 'revolving_credit')),
    currency         CHAR(3) NOT NULL DEFAULT 'GBP' CHECK (currency = 'GBP'),
    -- 0 is allowed: a cancelled facility keeps its history but can't be drawn. (CR3 must handle
    -- "utilisation of a zero limit" without dividing by zero.)
    limit_pence      BIGINT  NOT NULL CHECK (limit_pence >= 0),
    opened_on        DATE    NOT NULL,
    matures_on       DATE    NOT NULL,
    CONSTRAINT facilities_matures_after_opening CHECK (matures_on > opened_on)
);

CREATE INDEX facilities_counterparty_idx ON facilities (counterparty_id);

CREATE TABLE drawdowns (
    id            UUID   PRIMARY KEY,
    facility_id   UUID   NOT NULL REFERENCES facilities (id),
    kind          TEXT   NOT NULL CHECK (kind IN ('drawdown', 'repayment')),
    -- Signed, like ledger entries: drawn money is positive, a repayment negative. So exposure is a plain SUM.
    amount_pence  BIGINT NOT NULL,
    occurred_on   DATE   NOT NULL,
    CONSTRAINT drawdowns_sign_matches_kind CHECK (
        (kind = 'drawdown' AND amount_pence > 0) OR (kind = 'repayment' AND amount_pence < 0))
);

-- Exposure per facility, and "what happened recently", both read drawdowns by facility and date.
CREATE INDEX drawdowns_facility_date_idx ON drawdowns (facility_id, occurred_on);

-- A borrower can't repay more than it owes: a facility's running total may never go below zero.
-- Checked at COMMIT (deferred), so a batch of movements is judged as a whole, like the ledger's balance check.
CREATE FUNCTION assert_facility_not_overpaid() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE
    lowest BIGINT;
BEGIN
    SELECT MIN(running) INTO lowest
      FROM (SELECT SUM(amount_pence) OVER (ORDER BY occurred_on, kind, id) AS running
              FROM drawdowns WHERE facility_id = NEW.facility_id) movements;
    IF lowest < 0 THEN
        RAISE EXCEPTION 'facility % would be repaid more than was drawn (running total %)', NEW.facility_id, lowest;
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER drawdowns_not_overpaid
    AFTER INSERT ON drawdowns
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_facility_not_overpaid();

-- Movements are history: append-only, like the ledger and the audit log (function from V1).
-- A mistake is corrected with a new, opposite movement.
CREATE TRIGGER drawdowns_append_only
    BEFORE UPDATE OR DELETE ON drawdowns
    FOR EACH ROW EXECUTE FUNCTION reject_change_to_append_only_table();
CREATE TRIGGER drawdowns_no_truncate
    BEFORE TRUNCATE ON drawdowns
    FOR EACH STATEMENT EXECUTE FUNCTION reject_change_to_append_only_table();
