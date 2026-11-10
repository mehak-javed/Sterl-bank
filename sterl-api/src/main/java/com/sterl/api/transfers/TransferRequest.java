package com.sterl.api.transfers;

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

/**
 * A request to move money between two of the customer's own accounts.
 *
 * <p>{@code amountPence} is a {@code Long} (not {@code long}) so a MISSING amount fails validation
 * instead of silently becoming 0. JSON like {@code 12.99} or {@code "100"} is rejected before it
 * gets here (see application.properties): money is never rounded or guessed.
 *
 * @param reference optional, up to 18 characters: the UK Faster Payments reference limit, with the
 *                  characters banks accept
 */
public record TransferRequest(
		@NotNull UUID fromAccountId,
		@NotNull UUID toAccountId,
		@NotNull @Positive @Max(TransferRequest.MAX_AMOUNT_PENCE) Long amountPence,
		@Size(max = 18) @Pattern(regexp = "[A-Za-z0-9 .,&/'-]*") String reference) {

	/** £10,000 per transfer. */
	public static final long MAX_AMOUNT_PENCE = 1_000_000;

	/** The reference as stored: trimmed, and null when blank. */
	public String cleanReference() {
		return reference == null || reference.isBlank() ? null : reference.strip();
	}

	/**
	 * SHA-256 of what was asked. Stored with the idempotency key: a retry with the same key must
	 * be the same request, or it's rejected (a reused key is a bug in the caller, not a new payment).
	 */
	public String fingerprint() {
		String canonical = fromAccountId + "|" + toAccountId + "|" + amountPence + "|"
				+ (cleanReference() == null ? "" : cleanReference());
		try {
			byte[] hash = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 is always available on the JVM", e);
		}
	}
}
