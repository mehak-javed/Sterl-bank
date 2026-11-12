package com.sterl.api.payments;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** All SQL for payments and their screening. Every customer query is scoped to the customer id. */
@Repository
public class PaymentRepository {

	public record Payee(UUID id, String name, String type, Instant createdAt) {
	}

	public record PaymentRow(UUID id, UUID customerId, UUID fromAccountId, UUID payeeId, String payeeName, long amountPence,
			String reference, String status, int riskScore, List<String> ruleHits, String requestHash, Instant createdAt) {
	}

	private static final String PAYMENT_COLUMNS = """
			SELECT p.id, p.customer_id, p.from_account_id, p.payee_id, pe.name AS payee_name, p.amount_pence, p.reference,
			       p.status, p.risk_score, p.rule_hits, p.request_hash, p.created_at
			  FROM payments p JOIN payees pe ON pe.id = p.payee_id
			""";

	/** Card payments, direct debits, standing orders and payments: what "money out" means for the rules. */
	private static final String OUTGOING_KINDS = "('card', 'direct_debit', 'standing_order', 'payment')";

	private final JdbcClient jdbc;

	public PaymentRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/**
	 * Locks the customer's account for this transaction: payments from one account run one at a time,
	 * so two can't both pass the balance check (and duplicate keys are seen after the first commits).
	 */
	public boolean lockOwnAccount(UUID customerId, UUID accountId) {
		return jdbc.sql("SELECT id FROM accounts WHERE id = :id AND customer_id = :customerId AND type <> 'internal' FOR UPDATE")
				.param("id", accountId).param("customerId", customerId).query(UUID.class).optional().isPresent();
	}

	public Optional<Payee> findPayee(UUID customerId, UUID payeeId) {
		return jdbc.sql("SELECT id, name, type, created_at FROM payees WHERE id = :id AND customer_id = :customerId")
				.param("id", payeeId).param("customerId", customerId)
				.query((rs, i) -> new Payee(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3),
						rs.getObject(4, OffsetDateTime.class).toInstant()))
				.optional();
	}

	public long balanceOf(UUID accountId) {
		return jdbc.sql("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries WHERE account_id = :id")
				.param("id", accountId).query(Long.class).single();
	}

	/** [count, total pence] of the account's money out since the given moment. */
	public long[] outgoingSince(UUID accountId, Instant since) {
		return jdbc.sql("""
				SELECT count(*), COALESCE(SUM(-e.amount_pence), 0)
				  FROM ledger_entries e JOIN ledger_transactions t ON t.id = e.ledger_transaction_id
				 WHERE e.account_id = :accountId AND e.amount_pence < 0 AND t.occurred_at >= :since
				   AND t.kind IN """ + OUTGOING_KINDS)
				.param("accountId", accountId).param("since", java.sql.Timestamp.from(since))
				.query((rs, i) -> new long[] { rs.getLong(1), rs.getLong(2) }).single();
	}

	public int paymentsSince(UUID customerId, Instant since) {
		return jdbc.sql("SELECT count(*) FROM payments WHERE customer_id = :customerId AND created_at >= :since")
				.param("customerId", customerId).param("since", java.sql.Timestamp.from(since)).query(Integer.class).single();
	}

	public Optional<PaymentRow> findByKey(UUID customerId, String idempotencyKey) {
		return jdbc.sql(PAYMENT_COLUMNS + " WHERE p.customer_id = :customerId AND p.idempotency_key = :key")
				.param("customerId", customerId).param("key", idempotencyKey).query(PaymentRepository::toRow).optional();
	}

	public Optional<PaymentRow> findCustomerPayment(UUID customerId, UUID id) {
		return jdbc.sql(PAYMENT_COLUMNS + " WHERE p.id = :id AND p.customer_id = :customerId")
				.param("id", id).param("customerId", customerId).query(PaymentRepository::toRow).optional();
	}

	/** Money out: the customer's account down, the bank's OUTBOUND_PAYMENTS account up. Sums to zero. */
	public void insertLedgerPayment(UUID ledgerTransactionId, UUID accountId, long amountPence, String description) {
		jdbc.sql("""
				INSERT INTO ledger_transactions (id, kind, description, category, occurred_at)
				VALUES (:id, 'payment', :description, 'Payments', now())
				""").param("id", ledgerTransactionId).param("description", description).update();
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence)
				SELECT gen_random_uuid(), :tx, :accountId, -CAST(:amount AS bigint)
				UNION ALL
				SELECT gen_random_uuid(), :tx, bank.id, CAST(:amount AS bigint) FROM accounts bank WHERE bank.code = 'OUTBOUND_PAYMENTS'
				""").param("tx", ledgerTransactionId).param("accountId", accountId).param("amount", amountPence).update();
	}

	public void insertPayment(UUID id, UUID customerId, PaymentRequest request, ScreeningResult result, String status,
			UUID ledgerTransactionId, String idempotencyKey) {
		jdbc.sql("""
				INSERT INTO payments (id, customer_id, from_account_id, payee_id, amount_pence, reference, status, risk_score,
				                      rule_hits, ledger_transaction_id, idempotency_key, request_hash, decided_at)
				VALUES (:id, :customerId, :from, :payee, :amount, :reference, :status, :score,
				        CAST(:hits AS text[]), :ledgerTx, :key, :hash, CASE WHEN :status = 'settled' THEN now() END)
				""")
				.param("id", id).param("customerId", customerId).param("from", request.fromAccountId())
				.param("payee", request.payeeId()).param("amount", request.amountPence())
				.param("reference", request.cleanReference()).param("status", status).param("score", result.riskScore())
				.param("hits", "{" + String.join(",", result.hitCodes()) + "}")
				.param("ledgerTx", ledgerTransactionId).param("key", idempotencyKey).param("hash", request.fingerprint())
				.update();
	}

	public void audit(String actor, String action, UUID paymentId, String detailsJson) {
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, :action, 'payment', :id, CAST(:details AS jsonb))
				""").param("actor", actor).param("action", action).param("id", paymentId.toString()).param("details", detailsJson).update();
	}

	// ---------- the risk officers' queue ----------

	public List<PaymentRow> listHeld() {
		return jdbc.sql(PAYMENT_COLUMNS + " WHERE p.status = 'held' ORDER BY p.created_at").query(PaymentRepository::toRow).list();
	}

	/** Locks a payment that is still held; empty if it doesn't exist or was already decided. */
	public Optional<PaymentRow> lockHeld(UUID id) {
		return jdbc.sql(PAYMENT_COLUMNS + " WHERE p.id = :id AND p.status = 'held' FOR UPDATE OF p")
				.param("id", id).query(PaymentRepository::toRow).optional();
	}

	/** Staff only (the caller is under /api/risk): any payment by id. */
	public Optional<PaymentRow> findForStaff(UUID id) {
		return jdbc.sql(PAYMENT_COLUMNS + " WHERE p.id = :id").param("id", id).query(PaymentRepository::toRow).optional();
	}

	public boolean exists(UUID id) {
		return jdbc.sql("SELECT EXISTS (SELECT 1 FROM payments WHERE id = :id)").param("id", id).query(Boolean.class).single();
	}

	public void markDecided(UUID id, String status, UUID ledgerTransactionId, String reviewer, String note) {
		jdbc.sql("""
				UPDATE payments SET status = :status, ledger_transaction_id = :ledgerTx, reviewed_by = :reviewer,
				                    review_note = :note, decided_at = now()
				 WHERE id = :id AND status = 'held'
				""").param("status", status).param("ledgerTx", ledgerTransactionId).param("reviewer", reviewer)
				.param("note", note).param("id", id).update();
	}

	// ---------- explanations ----------

	public void insertAiLog(UUID paymentId, ScreeningResult result, PaymentExplainer by, Explanation explanation,
			String aiInputJson, long latencyMs, String error) {
		jdbc.sql("""
				INSERT INTO ai_audit_logs (payment_id, decision, risk_score, rule_hits, explained_by, model, customer_message,
				                           reviewer_note, ai_input, latency_ms, error)
				VALUES (:paymentId, :decision, :score, CAST(:hits AS text[]), :by, :model, :customerMessage,
				        :reviewerNote, CAST(:input AS jsonb), :latency, :error)
				""")
				.param("paymentId", paymentId).param("decision", result.decision().code()).param("score", result.riskScore())
				.param("hits", "{" + String.join(",", result.hitCodes()) + "}").param("by", by.source()).param("model", by.model())
				.param("customerMessage", explanation.customerMessage()).param("reviewerNote", explanation.reviewerNote())
				.param("input", aiInputJson).param("latency", (int) Math.min(Integer.MAX_VALUE, latencyMs)).param("error", error)
				.update();
	}

	public Optional<Explanation> latestExplanation(UUID paymentId) {
		return jdbc.sql("""
				SELECT customer_message, reviewer_note FROM ai_audit_logs WHERE payment_id = :id ORDER BY id DESC LIMIT 1
				""").param("id", paymentId).query((rs, i) -> new Explanation(rs.getString(1), rs.getString(2))).optional();
	}

	private static PaymentRow toRow(ResultSet rs, int i) throws SQLException {
		Array hits = rs.getArray("rule_hits");
		return new PaymentRow(rs.getObject("id", UUID.class), rs.getObject("customer_id", UUID.class),
				rs.getObject("from_account_id", UUID.class), rs.getObject("payee_id", UUID.class), rs.getString("payee_name"),
				rs.getLong("amount_pence"), rs.getString("reference"), rs.getString("status"), rs.getInt("risk_score"),
				Arrays.asList((String[]) hits.getArray()), rs.getString("request_hash"),
				rs.getObject("created_at", OffsetDateTime.class).toInstant());
	}
}
