package com.sterl.api.accounts;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
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

import com.sterl.api.support.Fixtures;
import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

import jakarta.servlet.http.Cookie;
import tools.jackson.databind.json.JsonMapper;

/** Add money: a new customer's way to put money into an empty account. Real PostgreSQL. */
@SterlIntegrationTest
@AutoConfigureMockMvc
class AddMoneyApiTests {

	private static final String PASSWORD = "copper kettle river sunrise";
	private static final String JSON = MediaType.APPLICATION_JSON_VALUE;

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private Flyway flyway;

	private LoggedIn alex;
	private String everyday;

	/** A brand-new customer with an empty Everyday Account, on a freshly seeded bank. */
	@BeforeEach
	void newCustomer() {
		flyway.clean();
		flyway.migrate();
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		String body = JsonMapper.builder().build().writeValueAsString(
				Map.of("firstName", "Alex", "lastName", "Example", "email", "alex.money@example.com", "password", PASSWORD));
		assertThat(mvc.post().uri("/api/auth/signup").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(JSON).content(body)).hasStatus(HttpStatus.CREATED);
		alex = LoggedIn.as(mvc, "alex.money@example.com", PASSWORD);
		everyday = jdbc.sql("""
				SELECT a.id::text FROM accounts a JOIN app_users u ON u.customer_id = a.customer_id
				 WHERE u.email = 'alex.money@example.com'
				""").query(String.class).single();
	}

	@AfterEach
	void leaveItFresh() {
		flyway.clean();
		flyway.migrate();
	}

	@Test
	void addingMoneyToAnEmptyAccountShowsUpInTheBalanceAndTheStatement() {
		assertThat(addMoney(everyday, "{\"amountPence\":2500}", key()))
				.hasStatus(HttpStatus.CREATED).bodyJson().satisfies(t -> {
					assertThat(t).extractingPath("$.kind").isEqualTo("top_up");
					assertThat(t).extractingPath("$.description").isEqualTo("Money added");
					assertThat(t).extractingPath("$.amountPence").isEqualTo(2500);
					assertThat(t).extractingPath("$.balanceAfterPence").isEqualTo(2500);
				});

		assertThat(alex.get("/api/accounts/" + everyday)).bodyJson().extractingPath("$.balancePence").isEqualTo(2500);
		assertThat(alex.get("/api/accounts/" + everyday + "/transactions")).bodyJson().extractingPath("$.totalItems").isEqualTo(1);
		assertThat(jdbc.sql("SELECT count(*) FROM audit_log WHERE action = 'money.added'").query(Long.class).single()).isEqualTo(1L);
	}

	@Test
	void theLedgerStillBalancesToZero() {
		addMoney(everyday, "{\"amountPence\":123456}", key());
		assertThat(jdbc.sql("SELECT SUM(amount_pence) FROM ledger_entries").query(Long.class).single()).isZero();
	}

	@Test
	void sendingTheSameRequestTwiceAddsTheMoneyOnce() {
		String key = key();
		assertThat(addMoney(everyday, "{\"amountPence\":5000}", key)).hasStatus(HttpStatus.CREATED);
		assertThat(addMoney(everyday, "{\"amountPence\":5000}", key))
				.hasStatusOk().hasHeader("Idempotent-Replayed", "true");
		assertThat(alex.get("/api/accounts/" + everyday)).bodyJson().extractingPath("$.balancePence").isEqualTo(5000);

		// The same key for a DIFFERENT amount is a mistake, not a retry.
		assertThat(addMoney(everyday, "{\"amountPence\":9999}", key)).hasStatus(HttpStatus.UNPROCESSABLE_ENTITY);
	}

	@Test
	void youCanOnlyAddMoneyToYourOwnAccount() {
		assertThat(addMoney(Fixtures.EVERYDAY_ACCOUNT, "{\"amountPence\":100}", key())).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(addMoney(Fixtures.CARD_SETTLEMENT_ACCOUNT, "{\"amountPence\":100}", key())).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(jdbc.sql("SELECT count(*) FROM ledger_transactions WHERE kind = 'top_up'").query(Long.class).single()).isZero();
	}

	@Test
	void amountsMustBeWholePenceFromOnePennyToTenThousandPounds() {
		for (String bad : new String[] { "{\"amountPence\":0}", "{\"amountPence\":-500}", "{\"amountPence\":1000001}",
				"{\"amountPence\":12.5}", "{\"amountPence\":\"100\"}", "{}" }) {
			assertThat(addMoney(everyday, bad, key())).as(bad).hasStatus(HttpStatus.BAD_REQUEST);
		}
		assertThat(addMoney(everyday, "{\"amountPence\":1000000}", key())).hasStatus(HttpStatus.CREATED); // exactly £10,000 is fine
	}

	@Test
	void anIdempotencyKeyAndALoginAreRequired() {
		assertThat(alex.post("/api/accounts/" + everyday + "/top-ups").contentType(JSON).content("{\"amountPence\":100}"))
				.hasStatus(HttpStatus.BAD_REQUEST);
		// A valid CSRF token but no login: 401. (With no token at all, the CSRF check refuses first: 403.)
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		assertThat(mvc.post().uri("/api/accounts/" + everyday + "/top-ups").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.header("Idempotency-Key", key()).contentType(JSON).content("{\"amountPence\":100}"))
				.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	private MockMvcTester.MockMvcRequestBuilder addMoney(String accountId, String body, String idempotencyKey) {
		return alex.post("/api/accounts/" + accountId + "/top-ups").header("Idempotency-Key", idempotencyKey)
				.contentType(JSON).content(body);
	}

	private static String key() {
		return UUID.randomUUID().toString();
	}
}
