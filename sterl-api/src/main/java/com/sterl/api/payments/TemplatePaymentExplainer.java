package com.sterl.api.payments;

/**
 * The fixed-wording explainer: used when the AI is switched off, isn't needed (a clean payment), or
 * fails. A bank's payment flow must never depend on an outside AI being up.
 */
public class TemplatePaymentExplainer implements PaymentExplainer {

	@Override
	public Explanation explain(ExplainerInput input) {
		if ("approve".equals(input.decision())) {
			return new Explanation("Payment sent.", input.reasons().isEmpty() ? "No risk factors found."
					: "Approved with minor factors: " + String.join(" ", input.reasons()));
		}
		// Customers are told WHAT happens next, never which limit they crossed (that would teach fraudsters).
		return new Explanation(
				"We've paused this payment for a quick security check. Nothing has left your account yet, and we'll release it or get in touch shortly.",
				"Held with risk score " + input.riskScore() + ". " + String.join(" ", input.reasons()));
	}

	@Override
	public String source() {
		return "template";
	}

	@Override
	public String model() {
		return null;
	}
}
