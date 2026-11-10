package com.sterl.api.auth;

import static com.sterl.api.support.Fixtures.EVERYDAY_ACCOUNT;
import static com.sterl.api.support.Fixtures.SAVER_ACCOUNT;
import static com.sterl.api.support.LoggedIn.TOMAS_EMAIL;
import static com.sterl.api.support.LoggedIn.TOMAS_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

/**
 * The most important security property of a bank API: a logged-in customer can see and move ONLY
 * their own money. Guessing or copying someone else's account or transfer id must get nothing back.
 *
 * <p>This is OWASP API Security risk no. 1, "broken object level authorisation" (BOLA): the API checks
 * that you're logged in, but not that the thing you asked for is yours. Every test logs in as Tomas
 * and aims at the demo customer Nikita's data.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class CustomerIsolationTests {

	private static final String TOMAS_ACCOUNT = "ca507fc3-c825-5c97-a1c1-439ee0f9713d";
	private static final long TOMAS_BALANCE = 182_500 - 4_210 - 380; // opening balance minus two card payments
	private static final long NIKITA_EVERYDAY_BALANCE = 125_000;

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private Flyway flyway;

	private LoggedIn tomas;
	private LoggedIn nikita;

	@BeforeEach
	void freshBankThenLogInBoth() {
		flyway.clean();
		flyway.migrate();
		tomas = LoggedIn.as(mvc, TOMAS_EMAIL, TOMAS_PASSWORD);
		nikita = LoggedIn.asDemoCustomer(mvc);
	}

	@AfterEach
	void freshBank() {
		flyway.clean();
		flyway.migrate();
	}

	@Test
	void aCustomerSeesOnlyTheirOwnAccounts() {
		assertThat(tomas.get("/api/accounts")).hasStatusOk().bodyJson().satisfies(accounts -> {
			assertThat(accounts).extractingPath("$.length()").isEqualTo(1);
			assertThat(accounts).extractingPath("$[0].id").isEqualTo(TOMAS_ACCOUNT);
			assertThat(accounts).extractingPath("$[0].balancePence").asNumber().isEqualTo((int) TOMAS_BALANCE);
		});
		assertThat(nikita.get("/api/accounts")).bodyJson().extractingPath("$.length()").isEqualTo(3);
	}

	@Test
	void anotherCustomersAccountIsA404NotA403() {
		// 404, not 403: "forbidden" would confirm the account exists. To Tomas, it simply doesn't.
		assertThat(tomas.get("/api/accounts/" + EVERYDAY_ACCOUNT)).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(tomas.get("/api/accounts/" + EVERYDAY_ACCOUNT + "/transactions")).hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void aCustomerCantMoveMoneyBetweenSomeoneElsesAccounts() {
		MvcTestResult attempt = transfer(tomas, EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 10_000);

		assertThat(attempt).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(NIKITA_EVERYDAY_BALANCE);
	}

	@Test
	void aCustomerCantPayIntoSomeoneElsesAccountThroughTheTransferEndpoint() {
		// Transfers are between your OWN accounts; paying other people goes through payees (Days 12-14).
		assertThat(transfer(tomas, TOMAS_ACCOUNT, EVERYDAY_ACCOUNT, 1_000)).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(balance(TOMAS_ACCOUNT)).isEqualTo(TOMAS_BALANCE);
	}

	@Test
	void anotherCustomersTransferIsA404() {
		MvcTestResult nikitasTransfer = transfer(nikita, EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 2_000);
		assertThat(nikitasTransfer).hasStatus(HttpStatus.CREATED);
		String location = nikitasTransfer.getResponse().getHeader("Location");

		assertThat(nikita.get(location)).hasStatusOk();
		assertThat(tomas.get(location)).hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void idempotencyKeysBelongToOneCustomer() {
		// Two customers who happen to choose the same key don't collide or see each other's result.
		String sharedKey = "same-key-" + UUID.randomUUID();
		assertThat(transfer(nikita, EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 500, sharedKey)).hasStatus(HttpStatus.CREATED);

		MvcTestResult tomasWithSameKey = transfer(tomas, EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 500, sharedKey);
		assertThat(tomasWithSameKey).hasStatus(HttpStatus.NOT_FOUND); // not a replay of Nikita's transfer
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(NIKITA_EVERYDAY_BALANCE - 500); // moved once, by Nikita
	}

	// ---------- helpers ----------

	private MvcTestResult transfer(LoggedIn who, String from, String to, long pence) {
		return transfer(who, from, to, pence, UUID.randomUUID().toString());
	}

	private MvcTestResult transfer(LoggedIn who, String from, String to, long pence, String key) {
		return who.post("/api/transfers")
				.header("Idempotency-Key", key)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\",\"amountPence\":%d}".formatted(from, to, pence))
				.exchange();
	}

	private long balance(String accountId) {
		return jdbc.sql("SELECT balance_pence FROM account_balances WHERE account_id = ?::uuid")
				.param(accountId).query(Long.class).single();
	}
}
