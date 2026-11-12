package com.sterl.api.payments;

/**
 * Everything the rules look at, worked out from the database for ONE payment. All money in pence.
 * Deliberately holds no names, account numbers or sort codes: this is also what the AI is shown.
 *
 * @param amountPence           the payment being screened
 * @param averageOutgoingPence  average size of this account's payments out over the last 30 days (0 if none)
 * @param outgoingCount30Days   how many payments out those 30 days had
 * @param paymentsLast10Minutes payments to payees from this customer in the 10 minutes BEFORE this one
 * @param payeeAgeHours         how long ago the payee was added
 * @param payeeType             "person" or "business"
 */
public record ScreeningFacts(long amountPence, long averageOutgoingPence, int outgoingCount30Days,
		int paymentsLast10Minutes, long payeeAgeHours, String payeeType) {
}
