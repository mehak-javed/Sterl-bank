package com.sterl.api.cards;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * The cards Sterl offers. The product decides the network and the (published TEST) card number, so
 * the API can never issue an impossible card. Mirrors the website's lib/cards.ts and the
 * cards_brand_matches_product CHECK in V6.
 *
 * <p>Test numbers: Visa 4242 4242 4242 4242 and 4000 0566 5566 5556, Mastercard 5555 5555 5555 4444
 * and 5200 8282 8282 8210. Only the last 4 digits are ever stored.
 */
public enum CardProduct {
	DEBIT("debit", "Visa", "4242"),
	PREMIER("premier", "Mastercard", "8210"),
	TRAVEL("travel", "Mastercard", "4444"),
	VIRTUAL("virtual", "Visa", "5556");

	private final String code;
	private final String brand;
	private final String testLast4;

	CardProduct(String code, String brand, String testLast4) {
		this.code = code;
		this.brand = brand;
		this.testLast4 = testLast4;
	}

	/** In JSON a product is its lower-case code ("debit"), the same as the website and the database. */
	@JsonValue
	public String code() {
		return code;
	}

	public String brand() {
		return brand;
	}

	public String testLast4() {
		return testLast4;
	}
}
