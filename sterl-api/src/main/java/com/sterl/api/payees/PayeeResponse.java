package com.sterl.api.payees;

import java.time.Instant;
import java.util.UUID;

/**
 * A saved payee as the website shows it. Only the LAST 4 digits of the account number come back:
 * the screen never needs the full number after it was typed in once, so it never leaves the server.
 */
public record PayeeResponse(UUID id, String name, String type, String sortCode, String accountNumberLast4, Instant createdAt) {
}
