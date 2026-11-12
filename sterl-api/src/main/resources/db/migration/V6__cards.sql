-- V6: payment cards. A card belongs to one customer account and spends from it.
--
-- What is NOT stored, on purpose: the full card number, the CVV and the PIN. A bank keeps those in a
-- separate, PCI DSS-certified card vault; the banking app only needs the last 4 digits to show the card.
-- (Every Sterl card uses a published TEST number anyway, see CardProduct.java.)

CREATE TABLE cards (
    id            UUID        PRIMARY KEY,
    account_id    UUID        NOT NULL REFERENCES accounts (id),
    product       TEXT        NOT NULL CHECK (product IN ('debit', 'premier', 'travel', 'virtual')),
    brand         TEXT        NOT NULL CHECK (brand IN ('Visa', 'Mastercard')),
    name_on_card  TEXT        NOT NULL CHECK (char_length(name_on_card) BETWEEN 1 AND 26),
    last4         CHAR(4)     NOT NULL CHECK (last4 ~ '^\d{4}$'),
    expiry_month  SMALLINT    NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year   SMALLINT    NOT NULL CHECK (expiry_year BETWEEN 2026 AND 2100),
    frozen        BOOLEAN     NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- The product decides the network, so the data can never hold a Mastercard "Everyday Debit".
    -- (The website's lib/cards.ts makes the same pairing for the card designs.)
    CONSTRAINT cards_brand_matches_product CHECK (
        (product IN ('debit', 'virtual') AND brand = 'Visa')
        OR (product IN ('premier', 'travel') AND brand = 'Mastercard'))
);

-- At most one card of each product per account. This also makes "issue a card" safe when two clicks
-- race: the database refuses the second insert, and the API answers 409 Conflict.
CREATE UNIQUE INDEX cards_one_per_product ON cards (account_id, product);

-- "My cards" = cards on my accounts: the lookup goes accounts.customer_id -> cards.account_id.
-- The unique index above starts with account_id, so it already serves that join; no extra index.

-- Cards may only hang off CUSTOMER accounts, never the bank's internal ones. A CHECK can't look at
-- another table, so a trigger does it.
CREATE FUNCTION cards_customer_account_only() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = NEW.account_id AND type <> 'internal') THEN
        RAISE EXCEPTION 'cards can only be issued on customer accounts (account %)', NEW.account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cards_customer_account_only
    BEFORE INSERT OR UPDATE OF account_id ON cards
    FOR EACH ROW EXECUTE FUNCTION cards_customer_account_only();
