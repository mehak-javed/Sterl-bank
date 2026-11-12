package com.sterl.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

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

import jakarta.servlet.http.Cookie;

/**
 * Opening an account through POST /api/auth/signup, against a real PostgreSQL: what gets created,
 * that the new customer is logged straight in, and every way a sign-up is refused.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class SignupApiTests {

	private static final String GOOD_PASSWORD = "copper kettle river sunrise";

	/** Each test signs up from its own address, so the per-address limit never mixes tests up. */
	private static final AtomicInteger NEXT_IP = new AtomicInteger(10);

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Test
	void signingUpCreatesTheCustomerAnEmptyAccountAndALoginThenLogsYouIn() {
		MvcTestResult result = signUp("Alex", "Example", "Alex.New@Example.com", GOOD_PASSWORD, nextIp());

		assertThat(result).hasStatus(HttpStatus.CREATED).bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.email").isEqualTo("alex.new@example.com"); // stored in lower case
			assertThat(body).extractingPath("$.firstName").isEqualTo("Alex");
			assertThat(body).extractingPath("$.role").isEqualTo("customer");
		});
		assertThat(result.getResponse().getHeader("Location")).startsWith("/api/accounts/");

		// The password is stored only as an Argon2id hash.
		String hash = jdbc.sql("SELECT password_hash FROM app_users WHERE email = 'alex.new@example.com'").query(String.class).single();
		assertThat(hash).startsWith("{argon2@SpringSecurity_v5_8}$argon2id$").doesNotContain(GOOD_PASSWORD);

		// Logged straight in: the new session sees exactly one Everyday Account, at £0.00.
		Cookie session = result.getResponse().getCookie("SESSION");
		assertThat(session).isNotNull();
		assertThat(mvc.get().uri("/api/accounts").cookie(session)).hasStatusOk().bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.length()").isEqualTo(1);
			assertThat(body).extractingPath("$[0].name").isEqualTo("Everyday Account");
			assertThat(body).extractingPath("$[0].balancePence").isEqualTo(0);
			assertThat(body).extractingPath("$[0].sortCode").isEqualTo("04-00-75");
		});

		// ...and it's in the audit trail.
		assertThat(jdbc.sql("SELECT EXISTS (SELECT 1 FROM audit_log WHERE action = 'auth.signup' AND entity_id = 'alex.new@example.com')")
				.query(Boolean.class).single()).isTrue();
	}

	@Test
	void theNewCustomerCanLogInLaterWithTheSamePassword() {
		assertThat(signUp("Bea", "Later", "bea.later@example.com", GOOD_PASSWORD, nextIp())).hasStatus(HttpStatus.CREATED);
		LoggedIn bea = LoggedIn.as(mvc, "bea.later@example.com", GOOD_PASSWORD);
		assertThat(bea.get("/api/auth/me")).hasStatusOk().bodyJson().extractingPath("$.lastName").isEqualTo("Later");
	}

	@Test
	void aSecondAccountWithTheSameEmailIsRefused() {
		assertThat(signUp("Cy", "First", "cy.twice@example.com", GOOD_PASSWORD, nextIp())).hasStatus(HttpStatus.CREATED);
		// Same email, different case: still the same person.
		assertThat(signUp("Cy", "Second", "CY.TWICE@example.com", GOOD_PASSWORD, nextIp()))
				.hasStatus(HttpStatus.CONFLICT)
				.bodyJson().extractingPath("$.detail").isEqualTo("There's already an account with that email.");
	}

	@Test
	void anEmailAlreadyUsedByAnExistingCustomerIsRefused() {
		assertThat(signUp("Nik", "Copy", LoggedIn.DEMO_EMAIL, GOOD_PASSWORD, nextIp())).hasStatus(HttpStatus.CONFLICT);
	}

	@Test
	void missingOrBadFieldsAreNamedSoTheFormCanShowThem() {
		assertThat(signUp("", "Example", "not-an-email", GOOD_PASSWORD, nextIp()))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.bodyJson().satisfies(body -> {
					assertThat(body).extractingPath("$.errors.firstName").isEqualTo("Enter your first name");
					assertThat(body).extractingPath("$.errors.email").isEqualTo("Enter an email address like name@example.com");
				});
	}

	@Test
	void weakPasswordsAreRefusedOnTheServerToo() {
		assertThat(signUp("Dee", "Weak", "dee.weak@example.com", "Password1234!", nextIp()))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.bodyJson().extractingPath("$.errors.password").asString().startsWith("That password is too easy to guess");
		assertThat(signUp("Dee", "Weak", "dee.weak@example.com", "deeweakpassword1", nextIp()))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.bodyJson().extractingPath("$.errors.password").isEqualTo("Don't use your name or email in your password");
		// Nothing was created by the refused attempts.
		assertThat(jdbc.sql("SELECT EXISTS (SELECT 1 FROM customers WHERE email = 'dee.weak@example.com')").query(Boolean.class).single()).isFalse();
	}

	@Test
	void signingUpNeedsACsrfToken() {
		assertThat(mvc.post().uri("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content(json("Eve", "Forged", "eve.forged@example.com", GOOD_PASSWORD)))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void unknownFieldsAreRefusedSoNobodyCanSmuggleInARole() {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		String sneaky = """
				{"firstName":"Max","lastName":"Power","email":"max.power@example.com","password":"%s","role":"admin"}
				""".formatted(GOOD_PASSWORD);
		assertThat(mvc.post().uri("/api/auth/signup").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON).content(sneaky))
				.hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void repeatedFailedSignUpsFromOneAddressAreSlowedDown() {
		String ip = nextIp();
		for (int i = 0; i < 10; i++) {
			signUp("Spam", "Bot", "spam" + i + "@example.com", "Password1234!", ip); // all refused: weak password
		}
		assertThat(signUp("Spam", "Bot", "spam.last@example.com", GOOD_PASSWORD, ip))
				.hasStatus(HttpStatus.TOO_MANY_REQUESTS)
				.hasHeader("Retry-After", "60");
	}

	// ---------- helpers ----------

	private static String nextIp() {
		return "203.0.113." + NEXT_IP.getAndIncrement();
	}

	private static String json(String first, String last, String email, String password) {
		return toJson(Map.of("firstName", first, "lastName", last, "email", email, "password", password));
	}

	private static String toJson(Map<String, String> fields) {
		StringBuilder out = new StringBuilder("{");
		fields.forEach((key, value) -> out.append(out.length() > 1 ? "," : "").append('"').append(key).append("\":\"").append(value).append('"'));
		return out.append('}').toString();
	}

	private MvcTestResult signUp(String first, String last, String email, String password, String clientIp) {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		return mvc.post().uri("/api/auth/signup")
				.with(request -> {
					request.setRemoteAddr(clientIp);
					return request;
				})
				.cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content(json(first, last, email, password))
				.exchange();
	}
}
