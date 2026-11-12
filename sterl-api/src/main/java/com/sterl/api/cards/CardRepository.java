package com.sterl.api.cards;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.sterl.api.common.DataCipher;
import com.sterl.api.common.EncryptPersonalDataMigration;

/**
 * All SQL for cards. Every query that reads or changes a card joins through accounts and filters on
 * the customer id, so a card that isn't yours behaves exactly like a card that doesn't exist.
 *
 * <p>The name on the card, last 4 digits and expiry are stored encrypted (details_encrypted, see
 * {@link com.sterl.api.common.DataCipher}): decrypted here on the way out, encrypted on the way in.
 */
@Repository
public class CardRepository {

	private static final String CARD_COLUMNS = """
			SELECT c.id, c.account_id, c.product, c.brand, c.details_encrypted, c.frozen
			  FROM cards c
			  JOIN accounts a ON a.id = c.account_id
			""";

	/** The order the website shows cards in: by product, as in lib/cards.ts. */
	private static final String PRODUCT_ORDER = """
			 ORDER BY CASE c.product WHEN 'debit' THEN 1 WHEN 'premier' THEN 2 WHEN 'travel' THEN 3 ELSE 4 END, c.created_at
			""";

	private final JdbcClient jdbc;
	private final DataCipher cipher;

	public CardRepository(JdbcClient jdbc, DataCipher cipher) {
		this.jdbc = jdbc;
		this.cipher = cipher;
	}

	public List<CardResponse> findCustomerCards(UUID customerId) {
		return jdbc.sql(CARD_COLUMNS + " WHERE a.customer_id = :customerId" + PRODUCT_ORDER)
				.param("customerId", customerId)
				.query(this::toCard)
				.list();
	}

	public Optional<CardResponse> findCustomerCard(UUID customerId, UUID cardId) {
		return jdbc.sql(CARD_COLUMNS + " WHERE c.id = :id AND a.customer_id = :customerId")
				.param("id", cardId)
				.param("customerId", customerId)
				.query(this::toCard)
				.optional();
	}

	/**
	 * Same as {@link #findCustomerCard} but LOCKS the row until the transaction ends, so two
	 * freeze/unfreeze requests for one card run one after the other and each audit record is true.
	 */
	public Optional<CardResponse> lockCustomerCard(UUID customerId, UUID cardId) {
		return jdbc.sql(CARD_COLUMNS + " WHERE c.id = :id AND a.customer_id = :customerId FOR UPDATE OF c")
				.param("id", cardId)
				.param("customerId", customerId)
				.query(this::toCard)
				.optional();
	}

	/**
	 * Locks the customer's row until the transaction ends. Two "add a card" requests from the same
	 * customer then run one after the other, so the "already have this card?" check can't be raced.
	 * (The unique index on (account_id, product) can't do it any more: each card has its own account.)
	 */
	public boolean lockCustomer(UUID customerId) {
		return jdbc.sql("SELECT id FROM customers WHERE id = :id FOR UPDATE")
				.param("id", customerId).query(UUID.class).optional().isPresent();
	}

	public boolean customerHasProduct(UUID customerId, CardProduct product) {
		return jdbc.sql("""
				SELECT EXISTS (SELECT 1 FROM cards c JOIN accounts a ON a.id = c.account_id
				                WHERE a.customer_id = :customerId AND c.product = :product)
				""")
				.param("customerId", customerId)
				.param("product", product.code())
				.query(Boolean.class)
				.single();
	}

	/** The card's own account, e.g. "Travel Card", with Sterl's sort code and a random account number. */
	public void insertCardAccount(UUID accountId, UUID customerId, String name, String sortCode, String accountNumber) {
		jdbc.sql("""
				INSERT INTO accounts (id, customer_id, type, name, sort_code, account_number)
				VALUES (:id, :customerId, 'current', :name, :sortCode, :accountNumber)
				""")
				.param("id", accountId)
				.param("customerId", customerId)
				.param("name", name)
				.param("sortCode", sortCode)
				.param("accountNumber", accountNumber)
				.update();
	}

	/**
	 * The starting balance and payments, as real double-entry ledger transactions:
	 * starting balance = OPENING_BALANCES -> card account; each payment = card account -> CARD_SETTLEMENT.
	 */
	public void insertStarterActivity(UUID accountId, StarterActivity.Plan plan) {
		insertLedgerTransaction("opening_balance", "Opening balance", "Opening balance", plan.startedAt(),
				"OPENING_BALANCES", accountId, plan.startingPence());
		for (StarterActivity.Payment payment : plan.payments()) {
			insertLedgerTransaction("card", payment.merchant(), payment.category(), payment.at(),
					null, accountId, -payment.pence());
		}
	}

	/**
	 * One ledger transaction with two legs that sum to zero: +amount on the customer's account and
	 * -amount on the bank's internal account (OPENING_BALANCES for money in, CARD_SETTLEMENT for spending).
	 */
	private void insertLedgerTransaction(String kind, String description, String category, java.time.Instant at,
			String internalCode, UUID accountId, long customerAmountPence) {
		UUID id = UUID.randomUUID();
		String internal = internalCode != null ? internalCode : "CARD_SETTLEMENT";
		jdbc.sql("""
				INSERT INTO ledger_transactions (id, kind, description, category, occurred_at)
				VALUES (:id, :kind, :description, :category, :at)
				""")
				.param("id", id)
				.param("kind", kind)
				.param("description", description)
				.param("category", category)
				.param("at", java.sql.Timestamp.from(at))
				.update();
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence)
				SELECT gen_random_uuid(), :tx, :accountId, CAST(:amount AS bigint)
				UNION ALL
				SELECT gen_random_uuid(), :tx, bank.id, -CAST(:amount AS bigint) FROM accounts bank WHERE bank.code = :internal
				""")
				.param("tx", id)
				.param("accountId", accountId)
				.param("amount", customerAmountPence)
				.param("internal", internal)
				.update();
	}

	/** The customer's full name, decrypted (customers' names are stored encrypted). */
	public String nameOf(UUID customerId) {
		return jdbc.sql("SELECT first_name, last_name FROM customers WHERE id = :id")
				.param("id", customerId)
				.query((rs, row) -> cipher.decrypt(rs.getString(1), EncryptPersonalDataMigration.nameContext("first_name", customerId))
						+ " " + cipher.decrypt(rs.getString(2), EncryptPersonalDataMigration.nameContext("last_name", customerId)))
				.single();
	}

	public boolean hasProduct(UUID accountId, CardProduct product) {
		return jdbc.sql("SELECT EXISTS (SELECT 1 FROM cards WHERE account_id = :accountId AND product = :product)")
				.param("accountId", accountId)
				.param("product", product.code())
				.query(Boolean.class)
				.single();
	}

	public void insert(UUID id, UUID accountId, CardProduct product, CardDetails details) {
		jdbc.sql("""
				INSERT INTO cards (id, account_id, product, brand, details_encrypted)
				VALUES (:id, :accountId, :product, :brand, :details)
				""")
				.param("id", id)
				.param("accountId", accountId)
				.param("product", product.code())
				.param("brand", product.brand())
				.param("details", cipher.encrypt(details.toStored(), CardDetails.context(id)))
				.update();
	}

	public void setFrozen(UUID cardId, boolean frozen) {
		jdbc.sql("UPDATE cards SET frozen = :frozen WHERE id = :id")
				.param("frozen", frozen)
				.param("id", cardId)
				.update();
	}

	/** In the same database transaction as the change: no card change without its audit record. */
	public void audit(UUID customerId, String action, UUID cardId, String product) {
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, :action, 'card', :entityId, jsonb_build_object('product', CAST(:product AS text)))
				""")
				.param("actor", "customer:" + customerId)
				.param("action", action)
				.param("entityId", cardId.toString())
				.param("product", product)
				.update();
	}

	private CardResponse toCard(ResultSet rs, int row) throws SQLException {
		UUID id = rs.getObject("id", UUID.class);
		CardDetails details = CardDetails.fromStored(cipher.decrypt(rs.getString("details_encrypted"), CardDetails.context(id)));
		return new CardResponse(
				id,
				rs.getObject("account_id", UUID.class),
				rs.getString("product"),
				rs.getString("brand"),
				details.nameOnCard(),
				details.last4(),
				details.expiryMonth(),
				details.expiryYear(),
				rs.getBoolean("frozen"));
	}
}
