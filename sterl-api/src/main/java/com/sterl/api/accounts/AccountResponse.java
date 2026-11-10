package com.sterl.api.accounts;

import java.util.UUID;

/**
 * An account as the API returns it. Field names match the front end's Account type,
 * so switching the front end to this API (Day 12) needs no renaming.
 *
 * @param balancePence calculated from the ledger, never stored (integer pence, ADR-001)
 */
public record AccountResponse(
		UUID id,
		UUID customerId,
		String type,
		String name,
		String sortCode,
		String accountNumber,
		String currency,
		long balancePence) {
}
