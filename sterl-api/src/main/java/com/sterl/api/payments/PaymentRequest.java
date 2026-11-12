package com.sterl.api.payments;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** POST /api/payments: pay one of your saved payees from one of your accounts. Same money rules as transfers. */
public record PaymentRequest(
		@NotNull UUID fromAccountId,
		@NotNull UUID payeeId,
		@NotNull @Positive @Max(PaymentRequest.MAX_AMOUNT_PENCE) Long amountPence,
		@Size(max = 18) @Pattern(regexp = "[A-Za-z0-9 .,&/'-]*") String reference) {

	/** £10,000 per payment. */
	public static final long MAX_AMOUNT_PENCE = 1_000_000;

	public String cleanReference() {
		return reference == null || reference.isBlank() ? null : reference.strip();
	}

	/** SHA-256 of the request, kept with the idempotency key: a retry must be the same payment. */
	public String fingerprint() {
		String canonical = "payment|" + fromAccountId + "|" + payeeId + "|" + amountPence + "|"
				+ (cleanReference() == null ? "" : cleanReference());
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 is always available on the JVM", e);
		}
	}
}
