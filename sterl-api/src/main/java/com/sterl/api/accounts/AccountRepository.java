package com.sterl.api.accounts;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * All SQL for accounts and statements, hand-written. Every value is a bound parameter (:name),
 * never glued into the SQL string, so SQL injection is impossible.
 *
 * <p>The SQL has a FIXED shape: each optional filter is written as
 * {@code (:value IS NULL OR column = :value)}. No string-building of WHERE clauses, so there is
 * exactly one query to read, review and test. (The CASTs tell PostgreSQL the type of a
 * parameter that might be null, which it can't work out on its own.)
 */
@Repository
public class AccountRepository {

	private static final String ACCOUNT_COLUMNS = """
			SELECT a.id, a.customer_id, a.type, a.name, a.sort_code, a.account_number, a.currency, b.balance_pence
			  FROM accounts a
			  JOIN account_balances b ON b.account_id = a.id
			""";

	/** Shared by the page query and the count query, so both always apply exactly the same filters. */
	private static final String STATEMENT_FILTERS = """
			 WHERE s.account_id = :accountId
			   AND (CAST(:category AS text)      IS NULL OR s.category = :category)
			   AND (CAST(:kind AS text)          IS NULL OR s.kind = :kind)
			   AND (CAST(:from AS timestamptz)   IS NULL OR s.occurred_at >= :from)
			   AND (CAST(:before AS timestamptz) IS NULL OR s.occurred_at <  :before)
			   AND (CAST(:search AS text)        IS NULL OR s.description ILIKE :search ESCAPE '\\')
			""";

	private final JdbcClient jdbc;

	public AccountRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/**
	 * One customer's accounts, never the bank's internal ones. Balances come from the ledger.
	 * The customer id always comes from {@code CurrentCustomer}, never from the request.
	 */
	public List<AccountResponse> findCustomerAccounts(UUID customerId) {
		return jdbc.sql(ACCOUNT_COLUMNS + """
				 WHERE a.customer_id = :customerId AND a.type <> 'internal'
				 ORDER BY CASE a.type WHEN 'current' THEN 1 WHEN 'saver' THEN 2 ELSE 3 END, a.name
				""")
				.param("customerId", customerId)
				.query(AccountRepository::toAccount)
				.list();
	}

	/** Empty when the account doesn't exist, is internal, or belongs to someone else. */
	public Optional<AccountResponse> findCustomerAccount(UUID customerId, UUID id) {
		return jdbc.sql(ACCOUNT_COLUMNS + """
				 WHERE a.id = :id AND a.customer_id = :customerId AND a.type <> 'internal'
				""")
				.param("id", id)
				.param("customerId", customerId)
				.query(AccountRepository::toAccount)
				.optional();
	}

	/**
	 * One page of an account's statement, newest first.
	 *
	 * <p>balance_after_pence stays correct even when filtering: account_statement calculates the
	 * running balance with a window function over ALL of the account's entries, and PostgreSQL
	 * applies our category/date/search filters only AFTER that. So a "Groceries only" view still
	 * shows the real balance after each grocery payment.
	 */
	public List<TransactionResponse> findStatementPage(UUID accountId, TransactionFilter filter, int limit, long offset) {
		return jdbc.sql("""
				SELECT s.entry_id, s.account_id, s.ledger_transaction_id, s.occurred_at, s.kind,
				       s.description, s.category, s.amount_pence, s.balance_after_pence
				  FROM account_statement s
				""" + STATEMENT_FILTERS + """
				 ORDER BY s.occurred_at DESC, s.entry_id DESC
				 LIMIT :limit OFFSET :offset
				""")
				.params(statementParams(accountId, filter))
				.param("limit", limit)
				.param("offset", offset)
				.query(AccountRepository::toTransaction)
				.list();
	}

	public long countStatement(UUID accountId, TransactionFilter filter) {
		return jdbc.sql("SELECT COUNT(*) FROM account_statement s\n" + STATEMENT_FILTERS)
				.params(statementParams(accountId, filter))
				.query(Long.class)
				.single();
	}

	private static Map<String, Object> statementParams(UUID accountId, TransactionFilter filter) {
		Map<String, Object> params = new HashMap<>(); // HashMap, because Map.of() refuses null values
		params.put("accountId", accountId);
		params.put("category", filter.category());
		params.put("kind", filter.kind());
		params.put("from", toUtc(filter.from()));
		params.put("before", toUtc(filter.before()));
		params.put("search", filter.search() == null ? null : "%" + escapeLike(filter.search()) + "%");
		return params;
	}

	/**
	 * In LIKE patterns, % means "anything" and _ means "any one character". A customer searching
	 * for "100%" means the text "100%", so we escape them (and the escape character itself first).
	 */
	static String escapeLike(String text) {
		return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

	private static OffsetDateTime toUtc(Instant instant) {
		return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
	}

	private static AccountResponse toAccount(ResultSet rs, int row) throws SQLException {
		return new AccountResponse(
				rs.getObject("id", UUID.class),
				rs.getObject("customer_id", UUID.class),
				rs.getString("type"),
				rs.getString("name"),
				rs.getString("sort_code"),
				rs.getString("account_number"),
				rs.getString("currency"),
				rs.getLong("balance_pence"));
	}

	// ---------- Add money ----------

	/** Locks one of the customer's own accounts for this transaction. False if it isn't theirs. */
	public boolean lockOwnAccount(UUID customerId, UUID accountId) {
		return jdbc.sql("""
				SELECT id FROM accounts
				 WHERE id = :id AND customer_id = :customerId AND type <> 'internal'
				   FOR UPDATE
				""")
				.param("id", accountId)
				.param("customerId", customerId)
				.query(UUID.class)
				.optional()
				.isPresent();
	}

	/** Both legs: out of the bank's INBOUND_PAYMENTS account, into the customer's. Sums to zero. */
	public void insertMoneyAdded(UUID ledgerTransactionId, UUID accountId, long amountPence) {
		jdbc.sql("""
				INSERT INTO ledger_transactions (id, kind, description, category, occurred_at)
				VALUES (:id, 'top_up', 'Money added', 'Income', now())
				""")
				.param("id", ledgerTransactionId)
				.update();
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence)
				SELECT gen_random_uuid(), :tx, inbound.id, -CAST(:amount AS bigint)
				  FROM accounts inbound WHERE inbound.code = 'INBOUND_PAYMENTS'
				UNION ALL
				SELECT gen_random_uuid(), :tx, :accountId, CAST(:amount AS bigint)
				""")
				.param("tx", ledgerTransactionId)
				.param("accountId", accountId)
				.param("amount", amountPence)
				.update();
	}

	public void auditMoneyAdded(UUID customerId, UUID ledgerTransactionId, UUID accountId, long amountPence, String key) {
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, 'money.added', 'ledger_transaction', :entityId,
				        jsonb_build_object('accountId', CAST(:account AS text), 'amountPence', CAST(:amount AS bigint),
				                           'idempotencyKey', CAST(:key AS text)))
				""")
				.param("actor", "customer:" + customerId)
				.param("entityId", ledgerTransactionId.toString())
				.param("account", accountId.toString())
				.param("amount", amountPence)
				.param("key", key)
				.update();
	}

	/** One account's leg of a ledger transaction, as a statement line (with its running balance). */
	public Optional<TransactionResponse> findEntry(UUID ledgerTransactionId, UUID accountId) {
		return jdbc.sql("""
				SELECT s.entry_id, s.account_id, s.ledger_transaction_id, s.occurred_at, s.kind,
				       s.description, s.category, s.amount_pence, s.balance_after_pence
				  FROM account_statement s
				 WHERE s.ledger_transaction_id = :tx AND s.account_id = :accountId
				""")
				.param("tx", ledgerTransactionId)
				.param("accountId", accountId)
				.query(AccountRepository::toTransaction)
				.optional();
	}

	static TransactionResponse toTransaction(ResultSet rs, int row) throws SQLException {
		String kind = rs.getString("kind");
		boolean betweenOwnAccounts = kind.equals("transfer") || kind.equals("roundup");
		return new TransactionResponse(
				rs.getObject("entry_id", UUID.class),
				rs.getObject("account_id", UUID.class),
				rs.getObject("occurred_at", OffsetDateTime.class).toInstant(),
				rs.getString("description"),
				rs.getString("category"),
				kind,
				rs.getLong("amount_pence"),
				rs.getLong("balance_after_pence"),
				betweenOwnAccounts ? rs.getObject("ledger_transaction_id", UUID.class) : null);
	}
}
