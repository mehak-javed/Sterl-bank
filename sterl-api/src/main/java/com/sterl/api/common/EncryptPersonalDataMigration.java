package com.sterl.api.common;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.migration.Context;
import org.flywaydb.core.api.migration.JavaMigration;
import org.springframework.stereotype.Component;

import com.sterl.api.cards.CardDetails;

/**
 * Flyway V9, written in Java because SQL alone can't encrypt: the key must never be in the database.
 * Spring Boot hands every JavaMigration bean to Flyway, so this runs in order after V8. (Implementing
 * JavaMigration directly lets the class keep a readable name; Flyway's base class wants "V9__...".)
 *
 * <p>Encrypts what's already there (the seeded customers and cards), then changes the tables so
 * plain values can't be stored again:
 * <ul>
 * <li>customers.first_name / last_name: encrypted in place, then a CHECK requires the enc: prefix.</li>
 * <li>cards: name on card, last 4 digits and expiry move into ONE encrypted column, details_encrypted;
 * the plain columns are dropped. product, brand and frozen stay readable: the database needs them for
 * its rules (one card per product, network matches product), and they don't identify anyone.</li>
 * </ul>
 * Balances and amounts stay readable on purpose: PostgreSQL must add them up. They're protected by
 * access control (only the API's database user) and, on a server, disk encryption.
 */
@Component
public class EncryptPersonalDataMigration implements JavaMigration {

	private final DataCipher cipher;

	public EncryptPersonalDataMigration(DataCipher cipher) {
		this.cipher = cipher;
	}

	@Override
	public MigrationVersion getVersion() {
		return MigrationVersion.fromVersion("9");
	}

	@Override
	public String getDescription() {
		return "encrypt personal data";
	}

	/** Java migrations have no file to checksum; null = Flyway doesn't check this one for edits. */
	@Override
	public Integer getChecksum() {
		return null;
	}

	/** All or nothing: if any row fails to encrypt, nothing is changed. */
	@Override
	public boolean canExecuteInTransaction() {
		return true;
	}

	@Override
	public void migrate(Context context) throws SQLException {
		Connection db = context.getConnection();
		encryptCustomerNames(db);
		encryptCardDetails(db);
	}

	public static String nameContext(String column, UUID customerId) {
		return "customers." + column + ":" + customerId;
	}

	private void encryptCustomerNames(Connection db) throws SQLException {
		try (Statement read = db.createStatement();
				ResultSet rows = read.executeQuery("SELECT id, first_name, last_name FROM customers");
				PreparedStatement write = db.prepareStatement("UPDATE customers SET first_name = ?, last_name = ? WHERE id = ?")) {
			while (rows.next()) {
				UUID id = rows.getObject("id", UUID.class);
				write.setString(1, cipher.encrypt(rows.getString("first_name"), nameContext("first_name", id)));
				write.setString(2, cipher.encrypt(rows.getString("last_name"), nameContext("last_name", id)));
				write.setObject(3, id);
				write.addBatch();
			}
			write.executeBatch();
		}
		try (Statement ddl = db.createStatement()) {
			ddl.execute("""
					ALTER TABLE customers ADD CONSTRAINT customers_names_encrypted
					    CHECK (first_name LIKE 'enc:v1:%' AND last_name LIKE 'enc:v1:%')
					""");
		}
	}

	private void encryptCardDetails(Connection db) throws SQLException {
		try (Statement ddl = db.createStatement()) {
			ddl.execute("ALTER TABLE cards ADD COLUMN details_encrypted TEXT");
		}
		try (Statement read = db.createStatement();
				ResultSet rows = read.executeQuery("SELECT id, name_on_card, last4, expiry_month, expiry_year FROM cards");
				PreparedStatement write = db.prepareStatement("UPDATE cards SET details_encrypted = ? WHERE id = ?")) {
			while (rows.next()) {
				UUID id = rows.getObject("id", UUID.class);
				CardDetails details = new CardDetails(rows.getString("name_on_card"), rows.getString("last4"),
						rows.getInt("expiry_month"), rows.getInt("expiry_year"));
				write.setString(1, cipher.encrypt(details.toStored(), CardDetails.context(id)));
				write.setObject(2, id);
				write.addBatch();
			}
			write.executeBatch();
		}
		try (Statement ddl = db.createStatement()) {
			ddl.execute("""
					ALTER TABLE cards
					    DROP COLUMN name_on_card,
					    DROP COLUMN last4,
					    DROP COLUMN expiry_month,
					    DROP COLUMN expiry_year,
					    ALTER COLUMN details_encrypted SET NOT NULL,
					    ADD CONSTRAINT cards_details_encrypted CHECK (details_encrypted LIKE 'enc:v1:%')
					""");
		}
	}
}
