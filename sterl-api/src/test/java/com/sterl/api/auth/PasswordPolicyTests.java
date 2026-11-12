package com.sterl.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** The password rules on their own: no database or web layer needed. */
class PasswordPolicyTests {

	private static String problem(String password) {
		return PasswordPolicy.problem(password, "Alex", "Example", "alex.e@example.com").orElse(null);
	}

	@Test
	void aLongPassphraseIsFine() {
		assertThat(problem("copper kettle river sunrise")).isNull();
	}

	@Test
	void lengthMustBe12To128() {
		assertThat(problem("short pass")).isEqualTo("Use at least 12 characters");
		assertThat(problem("x".repeat(129))).isEqualTo("Use 128 characters or fewer");
		assertThat(problem("y".repeat(12) + "z")).isNull();
	}

	@Test
	void yourOwnNameOrEmailIsRefusedInAnyCase() {
		assertThat(problem("ALEXSECRETWORD9")).isEqualTo("Don't use your name or email in your password");
		assertThat(problem("my example passphrase")).isEqualTo("Don't use your name or email in your password");
		assertThat(problem("i am alex.e on the web")).isEqualTo("Don't use your name or email in your password");
	}

	@Test
	void wellKnownPasswordsAreRefusedEvenPaddedWithNumbersAndSymbols() {
		assertThat(problem("Password1234!")).startsWith("That password is too easy to guess");
		assertThat(problem("qwertyuiop12345")).startsWith("That password is too easy to guess");
		assertThat(problem("pass word 2024!!")).startsWith("That password is too easy to guess");
		assertThat(problem("123456789012")).startsWith("That password is too easy to guess"); // no letters at all
	}
}
