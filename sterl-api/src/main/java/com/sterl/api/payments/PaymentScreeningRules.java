package com.sterl.api.payments;

import java.util.ArrayList;
import java.util.List;

/**
 * The decision. Pure function of the facts: no database, no clock, no AI, so every edge case has a test.
 * Score = sum of the points of the rules that fired, capped at 100; 50 or more holds the payment.
 */
public final class PaymentScreeningRules {

	public static final int HOLD_AT_SCORE = 50;
	static final long HIGH_VALUE_PENCE = 500_000; // £5,000
	/** With fewer than 3 payments in 30 days there's no "usual" to compare with: over £1,000 counts as large. */
	static final long LARGE_WITHOUT_HISTORY_PENCE = 100_000;
	static final int MIN_HISTORY = 3;
	static final int LARGE_MULTIPLE = 3;
	static final int RAPID_REPEAT_AFTER = 2;
	static final long NEW_PAYEE_HOURS = 24;

	private PaymentScreeningRules() {
	}

	public static ScreeningResult screen(ScreeningFacts facts) {
		List<ScreeningRule> hits = new ArrayList<>();
		long amount = facts.amountPence();

		if (amount >= HIGH_VALUE_PENCE) {
			hits.add(ScreeningRule.HIGH_VALUE);
		}
		boolean enoughHistory = facts.outgoingCount30Days() >= MIN_HISTORY;
		// Integer maths: "amount > 3 × average", never a floating-point ratio.
		if (enoughHistory ? amount > LARGE_MULTIPLE * facts.averageOutgoingPence() : amount > LARGE_WITHOUT_HISTORY_PENCE) {
			hits.add(ScreeningRule.LARGE_FOR_THIS_CUSTOMER);
		}
		if (facts.paymentsLast10Minutes() >= RAPID_REPEAT_AFTER) {
			hits.add(ScreeningRule.RAPID_REPEAT);
		}
		if (facts.payeeAgeHours() < NEW_PAYEE_HOURS) {
			hits.add(ScreeningRule.NEW_PAYEE);
		}

		int score = Math.min(100, hits.stream().mapToInt(ScreeningRule::points).sum());
		ScreeningResult.Decision decision = score >= HOLD_AT_SCORE ? ScreeningResult.Decision.HOLD : ScreeningResult.Decision.APPROVE;
		return new ScreeningResult(decision, score, List.copyOf(hits));
	}
}
