package com.sterl.api.cards;

import java.util.UUID;

/**
 * The parts of a card that identify its holder, stored together as ONE encrypted value
 * (cards.details_encrypted). Before encryption they're joined into a small fixed format,
 * "NAME|last4|month|year"; a name on a card can't contain "|" (see {@link CardService#nameOnCard}).
 */
public record CardDetails(String nameOnCard, String last4, int expiryMonth, int expiryYear) {

	public CardDetails {
		if (nameOnCard.contains("|") || !last4.matches("\\d{4}") || expiryMonth < 1 || expiryMonth > 12) {
			throw new IllegalArgumentException("Invalid card details");
		}
	}

	/** Ties the encrypted value to its card: it can't be copied onto another card's row. */
	public static String context(UUID cardId) {
		return "cards.details:" + cardId;
	}

	public String toStored() {
		return nameOnCard + "|" + last4 + "|" + expiryMonth + "|" + expiryYear;
	}

	public static CardDetails fromStored(String stored) {
		String[] parts = stored.split("\\|", -1);
		if (parts.length != 4) {
			throw new IllegalStateException("Card details are not in the expected format");
		}
		return new CardDetails(parts[0], parts[1], Integer.parseInt(parts[2]), Integer.parseInt(parts[3]));
	}
}
