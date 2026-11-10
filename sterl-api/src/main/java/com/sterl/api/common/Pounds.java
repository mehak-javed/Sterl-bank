package com.sterl.api.common;

/**
 * Pence to pounds, for human-readable messages only. Integer maths throughout (ADR-001):
 * the API itself always speaks pence.
 */
public final class Pounds {

	private Pounds() {
	}

	/** 125000 → "£1,250.00", -500 → "-£5.00". */
	public static String format(long pence) {
		String sign = pence < 0 ? "-" : "";
		long abs = Math.abs(pence);
		return String.format("%s£%,d.%02d", sign, abs / 100, abs % 100);
	}
}
