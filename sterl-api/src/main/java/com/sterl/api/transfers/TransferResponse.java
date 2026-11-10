package com.sterl.api.transfers;

import java.time.Instant;
import java.util.UUID;

/**
 * A completed transfer, always rebuilt from the ledger: the first response and every replay
 * read the same rows, so they're identical.
 *
 * @param id                    the ledger transaction (both legs share it)
 * @param fromBalanceAfterPence the from-account's balance straight after this transfer
 * @param toBalanceAfterPence   the to-account's balance straight after this transfer
 */
public record TransferResponse(
		UUID id,
		UUID fromAccountId,
		UUID toAccountId,
		long amountPence,
		String description,
		Instant createdAt,
		long fromBalanceAfterPence,
		long toBalanceAfterPence) {
}
