package com.sterl.api.accounts;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One line of an account's statement: this account's leg of a ledger transaction.
 * Field names match the front end's Transaction type.
 *
 * @param id                the ledger entry (this account's leg)
 * @param date              when it happened, as an ISO-8601 UTC instant
 * @param amountPence       signed: negative = money out, positive = money in
 * @param balanceAfterPence the account's balance straight after this entry (running total)
 * @param transferId        for moves between the customer's own accounts, the shared ledger
 *                          transaction id that links both legs; left out of the JSON otherwise
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TransactionResponse(
		UUID id,
		UUID accountId,
		Instant date,
		String description,
		String category,
		String kind,
		long amountPence,
		long balanceAfterPence,
		UUID transferId) {
}
