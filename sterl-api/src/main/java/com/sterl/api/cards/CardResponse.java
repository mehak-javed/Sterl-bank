package com.sterl.api.cards;

import java.util.UUID;

/** A card as the website's Card type expects it. Never a full card number, CVV or PIN. */
public record CardResponse(UUID id, UUID accountId, String product, String brand, String nameOnCard, String last4,
		int expiryMonth, int expiryYear, boolean frozen) {
}
