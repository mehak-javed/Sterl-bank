package com.sterl.api.payments;

import java.time.Instant;
import java.util.UUID;

/**
 * What the customer sees. No risk score or rule names: telling customers which limit they crossed
 * would teach fraudsters how to stay under it.
 */
public record PaymentResponse(UUID id, String status, long amountPence, String payeeName, String reference, String message,
		Instant createdAt) {

	static PaymentResponse of(PaymentRepository.PaymentRow p, Explanation explanation) {
		return new PaymentResponse(p.id(), p.status(), p.amountPence(), p.payeeName(), p.reference(),
				explanation.customerMessage(), p.createdAt());
	}
}
