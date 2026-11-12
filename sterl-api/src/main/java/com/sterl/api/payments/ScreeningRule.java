package com.sterl.api.payments;

/**
 * The checks a payment goes through before money leaves Sterl. Each adds points to a 0–100 risk score.
 * Plain, fixed rules on purpose: a bank must be able to say exactly WHY a payment was held, test every
 * rule, and change one without retraining anything. (The AI only explains the result in words.)
 */
public enum ScreeningRule {

	/** £5,000 or more in one payment. */
	HIGH_VALUE(60, "The payment is £5,000 or more."),

	/** Much bigger than this customer usually pays (or large with almost no history to compare). */
	LARGE_FOR_THIS_CUSTOMER(55, "The payment is much larger than this account's usual payments."),

	/** The third payment to someone else within 10 minutes: a common pattern when a scammer is pushing. */
	RAPID_REPEAT(55, "Several payments have been made from this account in the last few minutes."),

	/** The payee was added less than a day ago. */
	NEW_PAYEE(30, "The payee was added less than a day ago.");

	private final int points;
	private final String plainEnglish;

	ScreeningRule(int points, String plainEnglish) {
		this.points = points;
		this.plainEnglish = plainEnglish;
	}

	public int points() {
		return points;
	}

	/** For staff and for the AI's input. Never shown to the customer as-is (it would reveal our limits). */
	public String plainEnglish() {
		return plainEnglish;
	}
}
