package com.sterl.api.accounts;

import java.time.Instant;

/**
 * Optional filters for a statement. A null field means "don't filter on this".
 *
 * @param from   include entries at or after this instant
 * @param before include entries strictly before this instant (an exclusive end avoids
 *               off-by-one-second bugs at midnight)
 * @param search case-insensitive text to find in the description, used literally
 */
public record TransactionFilter(String category, String kind, Instant from, Instant before, String search) {
}
