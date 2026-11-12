-- V8: "Add money" puts money into a customer's account. It's a new kind of ledger transaction:
-- INBOUND_PAYMENTS (the bank's internal account for money arriving from outside) -> the customer.
ALTER TABLE ledger_transactions DROP CONSTRAINT ledger_transactions_kind_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_kind_check CHECK (kind IN (
    'opening_balance', 'card', 'direct_debit', 'standing_order', 'salary', 'transfer', 'roundup', 'top_up'));
