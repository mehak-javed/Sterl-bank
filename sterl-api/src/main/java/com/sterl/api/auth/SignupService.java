package com.sterl.api.auth;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Opening an account: a customer (the banking relationship), their first account, and a login,
 * all created together or not at all (@Transactional).
 */
@Service
public class SignupService {

	/** Sterl's sort code: every Sterl account shares it, like a real bank's branch code. */
	static final String STERL_SORT_CODE = "04-00-75";

	/** Thrown when the email already has an account (the controller answers 409 Conflict). */
	public static class EmailTakenException extends RuntimeException {
		public EmailTakenException() {
			super("email already registered");
		}
	}

	private final JdbcClient jdbc;
	private final PasswordEncoder passwords;
	private final SecureRandom random = new SecureRandom();

	public SignupService(JdbcClient jdbc, PasswordEncoder passwords) {
		this.jdbc = jdbc;
		this.passwords = passwords;
	}

	public record NewCustomer(UUID userId, UUID customerId, UUID accountId) {
	}

	/**
	 * Creates the customer, an empty Everyday Account (balance £0.00: no ledger entries yet) and the
	 * login (role customer, password stored only as an Argon2id hash).
	 *
	 * The email check and the inserts are in one transaction, and app_users.email is UNIQUE: if two
	 * sign-ups for the same email race, the database refuses the second, so there can never be two.
	 */
	@Transactional
	public NewCustomer open(String firstName, String lastName, String email, String password) {
		String cleanEmail = email.strip().toLowerCase(Locale.ROOT);
		boolean taken = jdbc.sql("SELECT EXISTS (SELECT 1 FROM app_users WHERE email = :email)")
				.param("email", cleanEmail).query(Boolean.class).single();
		if (taken) {
			throw new EmailTakenException();
		}

		UUID customerId = UUID.randomUUID();
		jdbc.sql("INSERT INTO customers (id, first_name, last_name, email) VALUES (:id, :first, :last, :email)")
				.param("id", customerId)
				.param("first", firstName.strip())
				.param("last", lastName.strip())
				.param("email", cleanEmail)
				.update();

		UUID accountId = UUID.randomUUID();
		jdbc.sql("""
				INSERT INTO accounts (id, customer_id, type, name, sort_code, account_number)
				VALUES (:id, :customer, 'current', 'Everyday Account', :sortCode, :accountNumber)
				""")
				.param("id", accountId)
				.param("customer", customerId)
				.param("sortCode", STERL_SORT_CODE)
				// 8 random digits, from a secure source: account numbers shouldn't be guessable in sequence.
				.param("accountNumber", String.format("%08d", random.nextInt(100_000_000)))
				.update();

		UUID userId = UUID.randomUUID();
		jdbc.sql("""
				INSERT INTO app_users (id, customer_id, email, password_hash, role)
				VALUES (:id, :customer, :email, :hash, 'customer')
				""")
				.param("id", userId)
				.param("customer", customerId)
				.param("email", cleanEmail)
				.param("hash", passwords.encode(password)) // Argon2id, slow on purpose; never the password
				.update();

		return new NewCustomer(userId, customerId, accountId);
	}
}
