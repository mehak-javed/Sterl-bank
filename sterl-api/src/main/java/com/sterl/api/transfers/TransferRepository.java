package com.sterl.api.transfers;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** The SQL for transfers. Every statement runs inside the caller's database transaction. */
@Repository
public class TransferRepository {

	private final JdbcClient jdbc;

	public TransferRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public record IdempotencyRecord(String requestHash, UUID ledgerTransactionId) {
	}

	record LockedAccount(UUID id, String name) {
	}

	/**
	 * Tries to claim an idempotency key. Returns true if this request is the first to use it.
	 *
	 * <p>If another request with the same key is still in progress, PostgreSQL makes this INSERT
	 * WAIT on the primary key until that request commits or rolls back. Then: committed, so
	 * ON CONFLICT DO NOTHING inserts nothing and we replay its result; rolled back, so our insert
	 * goes ahead and we do the work. Two identical requests can never both move money.
	 */
	public boolean claimIdempotencyKey(UUID customerId, String key, String requestHash, UUID ledgerTransactionId) {
		return jdbc.sql("""
				INSERT INTO idempotency_records (customer_id, idempotency_key, request_hash, ledger_transaction_id)
				VALUES (:customerId, :key, :hash, :ledgerTransactionId)
				ON CONFLICT (customer_id, idempotency_key) DO NOTHING
				""")
				.param("customerId", customerId)
				.param("key", key)
				.param("hash", requestHash)
				.param("ledgerTransactionId", ledgerTransactionId)
				.update() == 1;
	}

	public Optional<IdempotencyRecord> findIdempotencyRecord(UUID customerId, String key) {
		return jdbc.sql("""
				SELECT request_hash, ledger_transaction_id FROM idempotency_records
				 WHERE customer_id = :customerId AND idempotency_key = :key
				""")
				.param("customerId", customerId)
				.param("key", key)
				.query((rs, row) -> new IdempotencyRecord(rs.getString(1), rs.getObject(2, UUID.class)))
				.optional();
	}

	/**
	 * Locks the customer's two accounts for the rest of this database transaction.
	 *
	 * <p>FOR UPDATE: any other transfer touching these accounts waits here until we commit, so the
	 * balance check below can't be beaten by a parallel request (no double-spend, no overdraft).
	 * ORDER BY id: every transfer locks accounts in the SAME order. Without it, A→B and B→A at the same
	 * moment could each hold one lock and wait forever for the other (a deadlock).
	 *
	 * <p>Only the customer's own, non-internal accounts match, so another customer's id simply isn't found.
	 */
	public List<LockedAccount> lockOwnAccounts(UUID customerId, UUID first, UUID second) {
		return jdbc.sql("""
				SELECT id, name FROM accounts
				 WHERE customer_id = :customerId AND type <> 'internal' AND (id = :first OR id = :second)
				 ORDER BY id
				   FOR UPDATE
				""")
				.param("customerId", customerId)
				.param("first", first)
				.param("second", second)
				.query((rs, row) -> new LockedAccount(rs.getObject(1, UUID.class), rs.getString(2)))
				.list();
	}

	/** Read AFTER the lock, so it includes every transfer committed before ours. */
	public long balanceOf(UUID accountId) {
		return jdbc.sql("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries WHERE account_id = :id")
				.param("id", accountId)
				.query(Long.class)
				.single();
	}

	/** Both legs of the double entry. The database's deferred trigger re-checks they sum to zero at commit. */
	public void insertTransfer(UUID ledgerTransactionId, UUID from, UUID to, long amountPence, String description) {
		jdbc.sql("""
				INSERT INTO ledger_transactions (id, kind, description, category, occurred_at)
				VALUES (:id, 'transfer', :description, 'Savings', now())
				""")
				.param("id", ledgerTransactionId)
				.param("description", description)
				.update();
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence) VALUES
				    (gen_random_uuid(), :tx, :from, -CAST(:amount AS bigint)),
				    (gen_random_uuid(), :tx, :to,    CAST(:amount AS bigint))
				""")
				.param("tx", ledgerTransactionId)
				.param("from", from)
				.param("to", to)
				.param("amount", amountPence)
				.update();
	}

	/** Same database transaction as the money movement: no transfer without its audit record. */
	public void audit(UUID customerId, UUID ledgerTransactionId, UUID from, UUID to, long amountPence, String key) {
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, 'transfer.created', 'ledger_transaction', :entityId,
				        jsonb_build_object('fromAccountId', CAST(:from AS text), 'toAccountId', CAST(:to AS text),
				                           'amountPence', CAST(:amount AS bigint), 'idempotencyKey', CAST(:key AS text)))
				""")
				.param("actor", "customer:" + customerId)
				.param("entityId", ledgerTransactionId.toString())
				.param("from", from.toString())
				.param("to", to.toString())
				.param("amount", amountPence)
				.param("key", key)
				.update();
	}

	/**
	 * A transfer as the customer sees it, only if it touches one of their accounts.
	 * The balances after come from the statement view's running total, so a replay shows the
	 * balances as they were straight after the transfer, not today's.
	 */
	public Optional<TransferResponse> findTransfer(UUID customerId, UUID ledgerTransactionId) {
		return jdbc.sql("""
				SELECT t.id, t.description, t.occurred_at,
				       o.account_id AS from_account_id, o.balance_after_pence AS from_balance_after,
				       i.account_id AS to_account_id,   i.balance_after_pence AS to_balance_after,
				       i.amount_pence
				  FROM ledger_transactions t
				  JOIN account_statement o ON o.ledger_transaction_id = t.id AND o.amount_pence < 0
				  JOIN account_statement i ON i.ledger_transaction_id = t.id AND i.amount_pence > 0
				  JOIN accounts a ON a.id = o.account_id AND a.customer_id = :customerId
				 WHERE t.id = :id AND t.kind = 'transfer'
				""")
				.param("customerId", customerId)
				.param("id", ledgerTransactionId)
				.query((rs, row) -> new TransferResponse(
						rs.getObject("id", UUID.class),
						rs.getObject("from_account_id", UUID.class),
						rs.getObject("to_account_id", UUID.class),
						rs.getLong("amount_pence"),
						rs.getString("description"),
						rs.getObject("occurred_at", OffsetDateTime.class).toInstant(),
						rs.getLong("from_balance_after"),
						rs.getLong("to_balance_after")))
				.optional();
	}
}
