package com.sterl.api.payments;

import java.util.List;

import com.sterl.api.common.Pounds;

/**
 * EXACTLY what the AI is shown, and stored in ai_audit_logs as proof. Redacted by construction: it can
 * only hold amounts, counts, the payee type and the rules' own words. There is no field for a name, an
 * account number, a sort code, an email or a reference, so none can leak to an outside service.
 */
public record ExplainerInput(String decision, int riskScore, String amount, String usualPaymentSize,
		int paymentsLast30Days, int paymentsLast10Minutes, long payeeAddedHoursAgo, String payeeType,
		List<String> reasons) {

	public static ExplainerInput of(ScreeningFacts facts, ScreeningResult result) {
		return new ExplainerInput(result.decision().code(), result.riskScore(), Pounds.format(facts.amountPence()),
				Pounds.format(facts.averageOutgoingPence()), facts.outgoingCount30Days(), facts.paymentsLast10Minutes(),
				facts.payeeAgeHours(), facts.payeeType(),
				result.hits().stream().map(ScreeningRule::plainEnglish).toList());
	}
}
