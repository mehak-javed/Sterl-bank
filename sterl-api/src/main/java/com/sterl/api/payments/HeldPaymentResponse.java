package com.sterl.api.payments;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** What a risk officer sees in the queue: the facts and the reviewer note, not the customer's name. */
public record HeldPaymentResponse(UUID id, String status, long amountPence, int riskScore, List<String> ruleHits,
		String reviewerNote, Instant createdAt) {
}
