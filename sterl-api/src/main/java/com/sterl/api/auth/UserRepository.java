package com.sterl.api.auth;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.sterl.api.common.DataCipher;
import com.sterl.api.common.EncryptPersonalDataMigration;

/** Users, their profile for /api/auth/me, and the login audit trail. */
@Repository
public class UserRepository {

	private final JdbcClient jdbc;
	private final DataCipher cipher;

	public UserRepository(JdbcClient jdbc, DataCipher cipher) {
		this.jdbc = jdbc;
		this.cipher = cipher;
	}

	/** Emails are stored and compared in lower case. */
	public Optional<SterlUser> findByEmail(String email) {
		return jdbc.sql("""
				SELECT id, customer_id, email, password_hash, role, enabled
				  FROM app_users WHERE email = lower(:email)
				""")
				.param("email", email)
				.query((rs, row) -> new SterlUser(
						rs.getObject("id", UUID.class),
						rs.getObject("customer_id", UUID.class),
						rs.getString("email"),
						rs.getString("password_hash"),
						rs.getString("role"),
						rs.getBoolean("enabled")))
				.optional();
	}

	public void recordLogin(UUID userId) {
		jdbc.sql("UPDATE app_users SET last_login_at = now() WHERE id = :id").param("id", userId).update();
	}

	/** The customer's name, decrypted, for greeting them. Keys first_name and last_name. */
	public Optional<Map<String, Object>> customerName(UUID customerId) {
		return jdbc.sql("SELECT first_name, last_name FROM customers WHERE id = :id")
				.param("id", customerId)
				.query((rs, row) -> Map.<String, Object>of(
						"first_name", cipher.decrypt(rs.getString(1), EncryptPersonalDataMigration.nameContext("first_name", customerId)),
						"last_name", cipher.decrypt(rs.getString(2), EncryptPersonalDataMigration.nameContext("last_name", customerId))))
				.optional();
	}

	/**
	 * Every login attempt, successful or not, goes in the audit log: repeated failures are how an
	 * attack shows up. The password is never logged.
	 */
	public void auditLogin(String actor, String action, String email, String clientIp) {
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, :action, 'user', lower(:email),
				        jsonb_build_object('clientIp', CAST(:ip AS text)))
				""")
				.param("actor", actor)
				.param("action", action)
				.param("email", email)
				.param("ip", clientIp)
				.update();
	}
}
