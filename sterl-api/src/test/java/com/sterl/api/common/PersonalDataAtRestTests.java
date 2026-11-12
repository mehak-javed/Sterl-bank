package com.sterl.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

/**
 * What someone reading the database directly (psql, a backup, a stolen copy) would see:
 * no names and no card details, while the API still shows customers their own.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class PersonalDataAtRestTests {

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private MockMvcTester mvc;

	@Test
	void namesAndCardDetailsAreUnreadableInTheTables() {
		List<String> names = jdbc.sql("SELECT first_name || ' ' || last_name FROM customers").query(String.class).list();
		assertThat(names).isNotEmpty().allSatisfy(row -> assertThat(row).matches("enc:v1:\\S+ enc:v1:\\S+"));

		String everything = String.join(" ", jdbc.sql("""
				SELECT c::text FROM customers c
				UNION ALL SELECT k::text FROM cards k
				""").query(String.class).list());
		for (String plain : List.of("Nikita", "Crist", "NIKITA CRIST", "Tomas", "Reyes", "TOMAS REYES", "|4242|", "|8210|")) {
			assertThat(everything).as("the tables contain " + plain).doesNotContain(plain);
		}
	}

	@Test
	void theDatabaseRefusesAPlainNameOrPlainCardDetails() {
		assertThat(refused("UPDATE customers SET first_name = 'Plain' WHERE email = 'tomas.reyes@example.com'")).isTrue();
		assertThat(refused("UPDATE cards SET details_encrypted = 'TOMAS REYES|4242|6|2029'")).isTrue();
	}

	@Test
	void customersStillSeeTheirOwnNameAndCards() {
		LoggedIn nikita = LoggedIn.asDemoCustomer(mvc);
		assertThat(nikita.get("/api/auth/me")).hasStatusOk().bodyJson().extractingPath("$.firstName").isEqualTo("Nikita");
		assertThat(nikita.get("/api/cards")).hasStatusOk().bodyJson().extractingPath("$[0].nameOnCard").isEqualTo("NIKITA CRIST");
	}

	private boolean refused(String sql) {
		try {
			jdbc.sql(sql).update();
			return false;
		}
		catch (RuntimeException expected) {
			return String.valueOf(expected.getMessage()).contains("_encrypted");
		}
	}
}
