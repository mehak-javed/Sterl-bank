package com.sterl.api.payments;

import java.util.List;

/** What the rules decided. HOLD means no money moves until a risk officer releases the payment. */
public record ScreeningResult(Decision decision, int riskScore, List<ScreeningRule> hits) {

	public enum Decision {
		APPROVE, HOLD;

		/** As stored in the database. */
		public String code() {
			return name().toLowerCase(java.util.Locale.ROOT);
		}
	}

	public List<String> hitCodes() {
		return hits.stream().map(ScreeningRule::name).toList();
	}
}
