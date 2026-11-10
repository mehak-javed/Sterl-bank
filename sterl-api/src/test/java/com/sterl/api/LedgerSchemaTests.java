package com.sterl.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;

import com.sterl.api.support.SterlIntegrationTest;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The ledger's rules, proved against a real PostgreSQL. These are the rules a bank's auditors care
 * about, so they're enforced by the database itself (constraints and triggers), not only by Java:
 * even a bug in the application can't create money, lose it, or rewrite history.
 */
@SterlIntegrationTest
class LedgerSchemaTests {

	/** The front end's fixtures: the database must hold exactly the same fake bank. */
	private static final Path FIXTURES = Path.of("..", "src", "mocks", "data");

	private static final String EVERYDAY_ACCOUNT = "f9312322-42e1-486f-916f-dd42ae894c25";
	private static final String CARD_SETTLEMENT = "00000000-0000-4000-8000-000000000002";

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private TransactionTemplate tx;

	private final JsonMapper json = JsonMapper.builder().build();

	// ---------- The seeded bank is consistent ----------

	@Test
	void everyLedgerTransactionHasAtLeastTwoLegsThatSumToZero() {
		List<String> unbalanced = jdbc.sql("""
				SELECT t.id
				  FROM ledger_transactions t
				  LEFT JOIN ledger_entries e ON e.ledger_transaction_id = t.id
				 GROUP BY t.id
				HAVING COUNT(e.id) < 2 OR COALESCE(SUM(e.amount_pence), 0) <> 0
				""").query(String.class).list();

		assertThat(unbalanced).isEmpty();
		assertThat(jdbc.sql("SELECT COUNT(*) FROM ledger_transactions").query(Long.class).single()).isEqualTo(630); // 618 + 12 (V5)
	}

	@Test
	void theWholeLedgerSumsToZero() {
		// Double-entry in one line: across every account, money in equals money out.
		Long total = jdbc.sql("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries").query(Long.class).single();
		assertThat(total).isZero();
	}

	@Test
	void balancesCalculatedFromTheLedgerMatchTheFrontEndFixtures() {
		JsonNode accounts = json.readTree(FIXTURES.resolve("accounts.json").toFile());
		assertThat(accounts.size()).isEqualTo(3);

		for (JsonNode account : accounts) {
			long balance = jdbc.sql("SELECT balance_pence FROM account_balances WHERE account_id = ?::uuid")
					.param(account.get("id").asString())
					.query(Long.class).single();
			assertThat(balance)
					.as("balance of %s", account.get("name").asString())
					.isEqualTo(account.get("balancePence").asLong());
		}
	}

	@Test
	void statementRunningBalancesMatchEveryTransactionInTheFixtures() {
		// The window function in account_statement must reproduce the balance after every single
		// transaction, exactly as the front end's generator calculated it.
		Map<String, Long> expected = new HashMap<>();
		for (JsonNode t : json.readTree(FIXTURES.resolve("transactions.json").toFile())) {
			expected.put(t.get("id").asString(), t.get("balanceAfterPence").asLong());
		}

		Map<String, Long> actual = new HashMap<>();
		jdbc.sql("SELECT entry_id::text, balance_after_pence FROM account_statement")
				.query((rs, row) -> actual.put(rs.getString(1), rs.getLong(2)))
				.list();

		assertThat(expected).hasSize(708);
		expected.forEach((id, balanceAfter) ->
				assertThat(actual.get(id)).as("balance after transaction %s", id).isEqualTo(balanceAfter));
	}

	@Test
	void moneyIsOnlyEverStoredAsWholePence() {
		// ADR-001, enforced: every *_pence column is BIGINT, and no column anywhere uses a
		// floating-point or MONEY type.
		List<String> penceColumnTypes = jdbc.sql("""
				SELECT DISTINCT data_type FROM information_schema.columns
				 WHERE table_schema = 'public' AND column_name LIKE '%pence%'
				""").query(String.class).list();
		List<String> floatColumns = jdbc.sql("""
				SELECT table_name || '.' || column_name FROM information_schema.columns
				 WHERE table_schema = 'public' AND data_type IN ('real', 'double precision', 'money', 'numeric')
				""").query(String.class).list();

		assertThat(penceColumnTypes).containsExactly("bigint");
		assertThat(floatColumns).isEmpty();
	}

	// ---------- The database refuses to create or lose money ----------

	@Test
	void anUnbalancedTransactionIsRejectedOnCommit() {
		UUID id = UUID.randomUUID();

		assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
			insertLedgerTransaction(id);
			insertEntry(id, EVERYDAY_ACCOUNT, 10_000); // £100 appears from nowhere: no matching leg
		})).rootCause().hasMessageContaining("unbalanced");

		assertThat(ledgerTransactionExists(id)).isFalse();
	}

	@Test
	void aTransactionWithNoEntriesIsRejectedOnCommit() {
		UUID id = UUID.randomUUID();

		assertThatThrownBy(() -> tx.executeWithoutResult(status -> insertLedgerTransaction(id)))
				.rootCause().hasMessageContaining("unbalanced");

		assertThat(ledgerTransactionExists(id)).isFalse();
	}

	@Test
	void aBalancedTransactionIsAccepted() {
		UUID id = UUID.randomUUID();

		tx.executeWithoutResult(status -> {
			insertLedgerTransaction(id);
			insertEntry(id, EVERYDAY_ACCOUNT, -2_50);
			insertEntry(id, CARD_SETTLEMENT, 2_50);
			// Run the deferred balance check now instead of at commit, then roll back,
			// so this test leaves the seeded bank untouched for the other tests.
			jdbc.sql("SET CONSTRAINTS ALL IMMEDIATE").update();
			status.setRollbackOnly();
		});

		assertThat(ledgerTransactionExists(id)).isFalse();
	}

	// ---------- History can't be rewritten ----------

	@Test
	void ledgerEntriesCannotBeChangedOrDeleted() {
		assertThatThrownBy(() -> jdbc.sql("UPDATE ledger_entries SET amount_pence = 1").update())
				.rootCause().hasMessageContaining("append-only");
		assertThatThrownBy(() -> jdbc.sql("DELETE FROM ledger_entries").update())
				.rootCause().hasMessageContaining("append-only");
		assertThatThrownBy(() -> jdbc.sql("TRUNCATE ledger_entries CASCADE").update())
				.rootCause().hasMessageContaining("append-only");
	}

	@Test
	void ledgerTransactionsCannotBeChangedOrDeleted() {
		assertThatThrownBy(() -> jdbc.sql("UPDATE ledger_transactions SET description = 'edited'").update())
				.rootCause().hasMessageContaining("append-only");
		assertThatThrownBy(() -> jdbc.sql("DELETE FROM ledger_transactions").update())
				.rootCause().hasMessageContaining("append-only");
	}

	@Test
	void auditLogEntriesCanBeAddedButNeverChanged() {
		tx.executeWithoutResult(status -> {
			long id = jdbc.sql("""
					INSERT INTO audit_log (actor, action, entity_type, entity_id)
					VALUES ('system', 'test.recorded', 'test', '1') RETURNING id
					""").query(Long.class).single();

			assertThatThrownBy(() -> jdbc.sql("UPDATE audit_log SET actor = 'someone else' WHERE id = ?").param(id).update())
					.rootCause().hasMessageContaining("append-only");
			status.setRollbackOnly();
		});
	}

	@Test
	void internalAccountsCannotHaveACustomerOrBankDetails() {
		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO accounts (id, type, code, name, sort_code, account_number)
				VALUES (gen_random_uuid(), 'internal', 'BAD', 'Bad internal account', '12-34-56', '12345678')
				""").update())
				.rootCause().hasMessageContaining("accounts_owner_matches_type");
	}

	// ---------- helpers ----------

	private void insertLedgerTransaction(UUID id) {
		jdbc.sql("""
				INSERT INTO ledger_transactions (id, kind, description, category, occurred_at)
				VALUES (?, 'card', 'Test payment', 'Shopping', now())
				""").param(id).update();
	}

	private void insertEntry(UUID ledgerTransactionId, String accountId, long amountPence) {
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence)
				VALUES (gen_random_uuid(), ?, ?::uuid, ?)
				""").params(ledgerTransactionId, accountId, amountPence).update();
	}

	private boolean ledgerTransactionExists(UUID id) {
		return jdbc.sql("SELECT EXISTS (SELECT 1 FROM ledger_transactions WHERE id = ?)")
				.param(id).query(Boolean.class).single();
	}
}
