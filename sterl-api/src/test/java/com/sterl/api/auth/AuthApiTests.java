package com.sterl.api.auth;

import static com.sterl.api.support.LoggedIn.DEMO_EMAIL;
import static com.sterl.api.support.LoggedIn.DEMO_PASSWORD;
import static com.sterl.api.support.LoggedIn.TOMAS_EMAIL;
import static com.sterl.api.support.LoggedIn.TOMAS_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;

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
 * Logging in, staying logged in, and logging out, plus the protections around every request:
 * CSRF tokens, security headers, session cookies, rate limiting and the audit trail.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class AuthApiTests {

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	// ---------- Without logging in ----------

	@Test
	void bankingNeedsALogin() {
		assertThat(mvc.get().uri("/api/accounts"))
				.hasStatus(HttpStatus.UNAUTHORIZED)
				.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
				.bodyJson().extractingPath("$.detail").isEqualTo("Please log in.");
		assertThat(mvc.get().uri("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);

		// Even with a valid CSRF token, no session = no transfer.
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		assertThat(mvc.post().uri("/api/transfers").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.header("Idempotency-Key", "anonymous-attempt-1").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void healthChecksStayPublic() {
		assertThat(mvc.get().uri("/actuator/health")).hasStatusOk();
	}

	// ---------- Logging in ----------

	@Test
	void loggingInReturnsTheProfileAndASecureSessionCookie() {
		MvcTestResult login = login(DEMO_EMAIL, DEMO_PASSWORD, "198.51.100.1");

		assertThat(login).hasStatusOk().bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.email").isEqualTo(DEMO_EMAIL);
			assertThat(body).extractingPath("$.firstName").isEqualTo("Nikita");
			assertThat(body).extractingPath("$.role").isEqualTo("customer");
			assertThat(body).extractingPath("$.customerId").isEqualTo("0d9b0fd3-2248-4649-9245-7c3890921ffc");
		});
		assertThat(contentOf(login)).doesNotContainIgnoringCase("password").doesNotContain("argon2");

		Cookie session = login.getResponse().getCookie("SESSION");
		assertThat(session).isNotNull();
		assertThat(session.isHttpOnly()).as("HttpOnly: page scripts can't read it").isTrue();
		assertThat(session.getSecure()).as("Secure: only sent over HTTPS").isTrue();
		assertThat(session.getAttribute("SameSite")).as("SameSite").isEqualTo("Lax");
	}

	@Test
	void aWrongPasswordAndAnUnknownEmailGetExactlyTheSameAnswer() {
		MvcTestResult wrongPassword = login(DEMO_EMAIL, "not the right passphrase", "198.51.100.2");
		MvcTestResult unknownEmail = login("nobody@example.com", "not the right passphrase", "198.51.100.2");

		assertThat(wrongPassword).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(unknownEmail).hasStatus(HttpStatus.UNAUTHORIZED);
		// Identical, so an attacker can't use the login form to find out which emails have accounts.
		assertThat(contentOf(unknownEmail)).isEqualTo(contentOf(wrongPassword))
				.contains("Email or password is incorrect.");
	}

	@Test
	void emailsAreCaseInsensitive() {
		assertThat(login("Nikita.Crist68@Example.COM", DEMO_PASSWORD, "198.51.100.3")).hasStatusOk();
	}

	@Test
	void loggingInNeedsACsrfToken() {
		// Without it, another website could silently log a visitor into an account of the attacker's choosing.
		assertThat(mvc.post().uri("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(DEMO_EMAIL, DEMO_PASSWORD)))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void meReturnsWhoIsLoggedIn() {
		LoggedIn tomas = LoggedIn.as(mvc, TOMAS_EMAIL, TOMAS_PASSWORD);
		assertThat(tomas.get("/api/auth/me")).hasStatusOk().bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.email").isEqualTo(TOMAS_EMAIL);
			assertThat(body).extractingPath("$.firstName").isEqualTo("Tomas");
		});
	}

	@Test
	void theLoginTimeIsRecorded() {
		LoggedIn.as(mvc, TOMAS_EMAIL, TOMAS_PASSWORD);
		assertThat(jdbc.sql("SELECT last_login_at IS NOT NULL FROM app_users WHERE email = ?")
				.param(TOMAS_EMAIL).query(Boolean.class).single()).isTrue();
	}

	// ---------- While logged in ----------

	@Test
	void changingDataWithoutTheCsrfTokenIsRefusedEvenWhenLoggedIn() {
		LoggedIn customer = LoggedIn.asDemoCustomer(mvc);
		// The session cookie alone (all a forged cross-site request would have) isn't enough.
		assertThat(mvc.post().uri("/api/transfers").cookie(customer.sessionCookie())
				.header("Idempotency-Key", "forged-request-1").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void everyResponseCarriesSecurityHeaders() {
		LoggedIn customer = LoggedIn.asDemoCustomer(mvc);
		MvcTestResult response = customer.get("/api/accounts").exchange();

		assertThat(response).hasStatusOk()
				.hasHeader("X-Content-Type-Options", "nosniff")
				.hasHeader("X-Frame-Options", "DENY")
				.hasHeader("Referrer-Policy", "no-referrer");
		assertThat(response.getResponse().getHeader("Content-Security-Policy")).contains("default-src 'none'");
		assertThat(response.getResponse().getHeader("Cache-Control")).contains("no-store"); // bank data is never cached
	}

	@Test
	void theSessionIsStoredOnTheServerWithoutThePasswordHash() {
		LoggedIn.as(mvc, TOMAS_EMAIL, TOMAS_PASSWORD);

		List<byte[]> attributes = jdbc.sql("""
				SELECT a.attribute_bytes FROM spring_session s
				  JOIN spring_session_attributes a ON a.session_primary_id = s.primary_id
				 WHERE s.principal_name = ?
				""").param(TOMAS_EMAIL).query(byte[].class).list();

		assertThat(attributes).isNotEmpty();
		// Spring Security erased the credentials after login, so even a leaked session row holds no hash.
		attributes.forEach(bytes -> assertThat(new String(bytes, StandardCharsets.ISO_8859_1)).doesNotContain("$argon2id$"));
	}

	@Test
	void loggingInGivesANewSessionIdSoAPlantedOneIsWorthless() {
		LoggedIn first = LoggedIn.asDemoCustomer(mvc);
		Cookie before = first.sessionCookie();

		// Log in again in the same browser (with the existing session cookie).
		Cookie csrf = LoggedIn.csrfCookie(mvc, before);
		MvcTestResult again = mvc.post().uri("/api/auth/login").cookie(before, csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(TOMAS_EMAIL, TOMAS_PASSWORD)).exchange();

		Cookie after = again.getResponse().getCookie("SESSION");
		assertThat(after).isNotNull();
		assertThat(after.getValue()).isNotEqualTo(before.getValue());
		assertThat(mvc.get().uri("/api/auth/me").cookie(before)).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	// ---------- Logging out ----------

	@Test
	void loggingOutEndsTheSessionOnTheServer() {
		LoggedIn customer = LoggedIn.as(mvc, TOMAS_EMAIL, TOMAS_PASSWORD);

		assertThat(customer.post("/api/auth/logout")).hasStatus(HttpStatus.NO_CONTENT);

		// The old cookie is now useless, even if someone copied it.
		assertThat(customer.get("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(jdbc.sql("SELECT COUNT(*) FROM spring_session s JOIN spring_session_attributes a "
				+ "ON a.session_primary_id = s.primary_id WHERE s.session_id = ?")
				.param(new String(java.util.Base64.getDecoder().decode(customer.sessionCookie().getValue()), StandardCharsets.UTF_8))
				.query(Long.class).single()).isZero();
	}

	// ---------- Password guessing ----------

	@Test
	void tooManyFailedLoginsFromOneAddressAreThrottled() {
		String attacker = "203.0.113.10";
		for (int i = 0; i < 10; i++) {
			assertThat(login(DEMO_EMAIL, "guess number " + i, attacker)).hasStatus(HttpStatus.UNAUTHORIZED);
		}

		// The 11th attempt is refused before the password is even checked, right password or not.
		MvcTestResult throttled = login(DEMO_EMAIL, DEMO_PASSWORD, attacker);
		assertThat(throttled).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
		assertThat(Long.parseLong(throttled.getResponse().getHeader("Retry-After"))).isBetween(1L, 60L);

		// Everyone else is unaffected.
		assertThat(login(DEMO_EMAIL, DEMO_PASSWORD, "203.0.113.11")).hasStatusOk();
	}

	@Test
	void everyLoginAttemptIsAudited() {
		login(TOMAS_EMAIL, "a wrong passphrase", "198.51.100.9");
		login(TOMAS_EMAIL, TOMAS_PASSWORD, "198.51.100.9");

		List<String> actions = jdbc.sql("""
				SELECT action FROM audit_log
				 WHERE entity_type = 'user' AND entity_id = ? AND details->>'clientIp' = '198.51.100.9'
				 ORDER BY id
				""").param(TOMAS_EMAIL).query(String.class).list();
		assertThat(actions).containsExactly("auth.login.failed", "auth.login.succeeded");
	}

	// ---------- helpers ----------

	/** A login from a given network address (each test uses its own, so the rate limiter can't leak between tests). */
	private MvcTestResult login(String email, String password, String clientIp) {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		return mvc.post().uri("/api/auth/login")
				.with(request -> {
					request.setRemoteAddr(clientIp);
					return request;
				})
				.cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password))
				.exchange();
	}

	private static String contentOf(MvcTestResult result) {
		try {
			return result.getResponse().getContentAsString();
		} catch (java.io.UnsupportedEncodingException e) {
			throw new IllegalStateException(e);
		}
	}
}
