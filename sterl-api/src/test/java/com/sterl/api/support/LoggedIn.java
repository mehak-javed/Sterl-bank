package com.sterl.api.support;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import jakarta.servlet.http.Cookie;

/**
 * A logged-in browser, for tests. It logs in exactly the way the website will:
 * <ol>
 *   <li>GET /api/auth/csrf to receive the XSRF-TOKEN cookie;</li>
 *   <li>POST /api/auth/login with that token copied into the X-XSRF-TOKEN header;</li>
 *   <li>GET /api/auth/csrf again, because login replaces the CSRF token.</li>
 * </ol>
 * Then every request carries the session cookie, and every POST also carries the CSRF token.
 */
public final class LoggedIn {

	/** Public demo logins (fake people; see docs/demo-accounts.md). */
	public static final String DEMO_EMAIL = "nikita.crist68@example.com";
	public static final String DEMO_PASSWORD = "sterl demo passphrase";
	public static final String TOMAS_EMAIL = "tomas.reyes@example.com";
	public static final String TOMAS_PASSWORD = "sterl test passphrase 1";

	private final MockMvcTester mvc;
	private final Cookie session;
	private final Cookie csrf;

	private LoggedIn(MockMvcTester mvc, Cookie session, Cookie csrf) {
		this.mvc = mvc;
		this.session = session;
		this.csrf = csrf;
	}

	public static LoggedIn asDemoCustomer(MockMvcTester mvc) {
		return as(mvc, DEMO_EMAIL, DEMO_PASSWORD);
	}

	public static LoggedIn as(MockMvcTester mvc, String email, String password) {
		Cookie csrf = csrfCookie(mvc, null);
		MvcTestResult login = mvc.post().uri("/api/auth/login")
				.cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password))
				.exchange();
		assertThat(login).as("login as " + email).hasStatusOk();
		Cookie session = login.getResponse().getCookie("SESSION");
		assertThat(session).as("session cookie").isNotNull();
		return new LoggedIn(mvc, session, csrfCookie(mvc, session));
	}

	/** A fresh XSRF-TOKEN cookie (optionally for an existing session). */
	public static Cookie csrfCookie(MockMvcTester mvc, Cookie session) {
		MockMvcTester.MockMvcRequestBuilder request = mvc.get().uri("/api/auth/csrf");
		if (session != null) {
			request = request.cookie(session);
		}
		Cookie csrf = request.exchange().getResponse().getCookie("XSRF-TOKEN");
		assertThat(csrf).as("XSRF-TOKEN cookie").isNotNull();
		return csrf;
	}

	public Cookie sessionCookie() {
		return session;
	}

	public MockMvcTester.MockMvcRequestBuilder get(String uri) {
		return mvc.get().uri(uri).cookie(session);
	}

	/** POST with the session AND the CSRF token, like the real front end. */
	public MockMvcTester.MockMvcRequestBuilder post(String uri) {
		return mvc.post().uri(uri).cookie(session, csrf).header("X-XSRF-TOKEN", csrf.getValue());
	}

	/** PATCH with the session AND the CSRF token. */
	public MockMvcTester.MockMvcRequestBuilder patch(String uri) {
		return mvc.patch().uri(uri).cookie(session, csrf).header("X-XSRF-TOKEN", csrf.getValue());
	}
}
