package com.sterl.api.auth;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * The rules a new password must meet. The website checks the same rules for instant feedback, but
 * the server is the gatekeeper: anyone can send requests without the website.
 *
 * Based on NIST SP 800-63B and the NCSC's advice: length beats complexity rules (12–128 characters,
 * passphrases welcome), and block passwords attackers try first: well-known ones, and ones built from
 * the person's own name or email.
 */
public final class PasswordPolicy {

	public static final int MIN_LENGTH = 12;
	public static final int MAX_LENGTH = 128;

	/**
	 * The "letters only" core of passwords attackers try first. "Password1234!" and "pass word 2024"
	 * both reduce to "password". (A real bank would also check a breached-password service.)
	 */
	private static final Set<String> COMMON = Set.of(
			"password", "passwords", "passw", "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbnm",
			"letmein", "iloveyou", "welcome", "admin", "administrator", "monkey", "dragon", "football",
			"baseball", "sunshine", "princess", "shadow", "master", "superman", "trustno", "abc",
			"abcdef", "abcdefgh", "changeme", "secret", "bank", "banking", "sterl", "sterlbank", "login");

	private PasswordPolicy() {
	}

	/** Empty if the password is acceptable; otherwise a message for the person, about the password field. */
	public static Optional<String> problem(String password, String firstName, String lastName, String email) {
		if (password == null || password.length() < MIN_LENGTH) {
			return Optional.of("Use at least " + MIN_LENGTH + " characters");
		}
		if (password.length() > MAX_LENGTH) {
			return Optional.of("Use " + MAX_LENGTH + " characters or fewer");
		}
		String lower = password.toLowerCase(Locale.ROOT);
		String emailName = email == null ? "" : email.split("@", 2)[0];
		boolean personal = Stream.of(firstName, lastName, emailName)
				.filter(part -> part != null && part.strip().length() >= 3)
				.map(part -> part.strip().toLowerCase(Locale.ROOT))
				.anyMatch(lower::contains);
		if (personal) {
			return Optional.of("Don't use your name or email in your password");
		}
		String lettersOnly = lower.replaceAll("[^a-z]", "");
		if (lettersOnly.isEmpty() || COMMON.contains(lettersOnly)) {
			return Optional.of("That password is too easy to guess. Try a few unrelated words");
		}
		return Optional.empty();
	}
}
