package com.sterl.api.payments;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.common.CurrentCustomer;
import com.sterl.api.common.Pounds;

/**
 * Paying someone: screen first, then move money only if the rules approve.
 *
 * <p>One database transaction per decision (lock, check, screen, write), and it never waits on the AI:
 * the explanation is written AFTER the decision is committed (see PaymentController), so an AI that is
 * slow or down can't hold locks or block a payment.
 */
@Service
public class PaymentService {

	static final HttpStatusCode UNPROCESSABLE = HttpStatusCode.valueOf(422);

	/** A decided payment, plus what the rules saw (for the explanation). replayed = an idempotent retry. */
	public record Decided(PaymentRepository.PaymentRow payment, ScreeningFacts facts, ScreeningResult result, boolean replayed) {
	}

	private final PaymentRepository payments;
	private final CurrentCustomer currentCustomer;
	private final Clock clock;

	public PaymentService(PaymentRepository payments, CurrentCustomer currentCustomer, Clock clock) {
		this.payments = payments;
		this.currentCustomer = currentCustomer;
		this.clock = clock;
	}

	@Transactional
	public Decided pay(PaymentRequest request, String idempotencyKey) {
		UUID customerId = currentCustomer.id();

		// 1. Lock the account first: same-account payments now run one at a time.
		if (!payments.lockOwnAccount(customerId, request.fromAccountId())) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found");
		}
		// 2. A retry of the same request? Answer with the original decision; never pay twice.
		var earlier = payments.findByKey(customerId, idempotencyKey);
		if (earlier.isPresent()) {
			if (!earlier.get().requestHash().equals(request.fingerprint())) {
				throw new ResponseStatusException(UNPROCESSABLE, "This Idempotency-Key was already used for a different payment.");
			}
			return new Decided(earlier.get(), null, null, true);
		}
		PaymentRepository.Payee payee = payments.findPayee(customerId, request.payeeId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payee not found"));
		long balance = payments.balanceOf(request.fromAccountId());
		if (balance < request.amountPence()) {
			throw new ResponseStatusException(UNPROCESSABLE, "There isn't enough money in this account: the balance is "
					+ Pounds.format(balance) + ".");
		}

		// 3. Screen. The rules decide; nothing else does.
		ScreeningFacts facts = factsFor(customerId, request, payee);
		ScreeningResult result = PaymentScreeningRules.screen(facts);

		// 4. Approved: money moves now. Held: nothing moves until a risk officer releases it.
		UUID paymentId = UUID.randomUUID();
		UUID ledgerTx = null;
		String status = "held";
		if (result.decision() == ScreeningResult.Decision.APPROVE) {
			ledgerTx = UUID.randomUUID();
			payments.insertLedgerPayment(ledgerTx, request.fromAccountId(), request.amountPence(), "Payment to " + payee.name());
			status = "settled";
		}
		payments.insertPayment(paymentId, customerId, request, result, status, ledgerTx, idempotencyKey);
		payments.audit("customer:" + customerId, "payment." + status, paymentId,
				"{\"amountPence\": %d, \"riskScore\": %d, \"ruleHits\": \"%s\"}".formatted(request.amountPence(),
						result.riskScore(), String.join(",", result.hitCodes())));
		return new Decided(payments.findCustomerPayment(customerId, paymentId).orElseThrow(), facts, result, false);
	}

	public PaymentRepository.PaymentRow get(UUID id) {
		return payments.findCustomerPayment(currentCustomer.id(), id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
	}

	private ScreeningFacts factsFor(UUID customerId, PaymentRequest request, PaymentRepository.Payee payee) {
		Instant now = clock.instant();
		long[] outgoing = payments.outgoingSince(request.fromAccountId(), now.minus(Duration.ofDays(30)));
		long count = outgoing[0];
		long average = count == 0 ? 0 : outgoing[1] / count; // whole pence, rounded down
		return new ScreeningFacts(request.amountPence(), average, (int) count,
				payments.paymentsSince(customerId, now.minus(Duration.ofMinutes(10))),
				Math.max(0, Duration.between(payee.createdAt(), now).toHours()), payee.type());
	}

	// ---------- risk officers ----------

	/** Release a held payment: re-check the balance now, then move the money. */
	@Transactional
	public PaymentRepository.PaymentRow release(UUID id, String staff, String note) {
		PaymentRepository.PaymentRow held = lockHeld(id);
		payments.lockOwnAccount(held.customerId(), held.fromAccountId());
		long balance = payments.balanceOf(held.fromAccountId());
		if (balance < held.amountPence()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"The account no longer has enough money (" + Pounds.format(balance) + "). Reject the payment instead.");
		}
		UUID ledgerTx = UUID.randomUUID();
		payments.insertLedgerPayment(ledgerTx, held.fromAccountId(), held.amountPence(), "Payment to " + held.payeeName());
		payments.markDecided(id, "released", ledgerTx, staff, note);
		payments.audit("staff:" + staff, "payment.released", id, "{\"note\": " + jsonString(note) + "}");
		return held;
	}

	@Transactional
	public PaymentRepository.PaymentRow reject(UUID id, String staff, String note) {
		PaymentRepository.PaymentRow held = lockHeld(id);
		payments.markDecided(id, "rejected", null, staff, note);
		payments.audit("staff:" + staff, "payment.rejected", id, "{\"note\": " + jsonString(note) + "}");
		return held;
	}

	private PaymentRepository.PaymentRow lockHeld(UUID id) {
		return payments.lockHeld(id).orElseThrow(() -> payments.exists(id)
				? new ResponseStatusException(HttpStatus.CONFLICT, "This payment has already been decided.")
				: new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
	}

	/** A note as a JSON string literal (quotes, backslashes and control characters escaped). */
	static String jsonString(String text) {
		StringBuilder out = new StringBuilder("\"");
		for (char c : text.toCharArray()) {
			switch (c) {
				case '"' -> out.append("\\\"");
				case '\\' -> out.append("\\\\");
				default -> {
					if (c < 0x20) {
						out.append(String.format("\\u%04x", (int) c));
					}
					else {
						out.append(c);
					}
				}
			}
		}
		return out.append('"').toString();
	}
}
