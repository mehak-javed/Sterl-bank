package com.sterl.api.web;

import static com.sterl.api.support.LoggedIn.DEMO_EMAIL;
import static com.sterl.api.support.LoggedIn.DEMO_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

import jakarta.servlet.http.Cookie;

/**
 * Behind the website, every request arrives from the website's servers. These tests prove the API still
 * sees each VISITOR (for the login limit and the audit log), and that nobody else can fake an address.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "sterl.proxy.shared-secret=" + WebsiteClientAddressFilterTests.SECRET)
class WebsiteClientAddressFilterTests {

	static final String SECRET = "test-only-proxy-secret-not-used-anywhere-else";
	/** All requests below come from this one address, like the website's servers in production. */
	private static final String WEBSITE_SERVER = "10.0.0.5";

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Test
	void oneAttackerBehindTheWebsiteDoesNotLockOutOtherVisitors() {
		for (int i = 0; i < 10; i++) {
			assertThat(login(DEMO_PASSWORD + " wrong " + i, SECRET, "203.0.113.50")).hasStatus(HttpStatus.UNAUTHORIZED);
		}
		assertThat(login(DEMO_PASSWORD, SECRET, "203.0.113.50")).hasStatus(HttpStatus.TOO_MANY_REQUESTS);

		// Same website server, different visitor: not affected.
		assertThat(login(DEMO_PASSWORD, SECRET, "203.0.113.51")).hasStatusOk();
	}

	@Test
	void theAuditLogRecordsTheVisitorNotTheWebsite() {
		long before = lastAuditId();
		login("a wrong passphrase", SECRET, "2001:db8::7");
		assertThat(clientIpsAuditedAfter(before)).contains("2001:db8:0:0:0:0:0:7").doesNotContain(WEBSITE_SERVER);
	}

	@Test
	void aClaimedAddressWithoutTheRightSecretIsIgnored() {
		long before = lastAuditId();
		login("a wrong passphrase", "a-guessed-secret", "198.51.100.77");
		login("a wrong passphrase", null, "198.51.100.78");
		assertThat(clientIpsAuditedAfter(before)).doesNotContain("198.51.100.77", "198.51.100.78").contains(WEBSITE_SERVER);
	}

	@Test
	void onlyPlainIpAddressesAreAccepted() {
		assertThat(WebsiteClientAddressFilter.ipLiteralOrNull("203.0.113.9")).isEqualTo("203.0.113.9");
		assertThat(WebsiteClientAddressFilter.ipLiteralOrNull("example.com")).isNull(); // never a DNS lookup
		assertThat(WebsiteClientAddressFilter.ipLiteralOrNull("203.0.113.9, 10.0.0.1")).isNull();
		assertThat(WebsiteClientAddressFilter.ipLiteralOrNull("")).isNull();
		assertThat(WebsiteClientAddressFilter.ipLiteralOrNull(null)).isNull();
	}

	@Test
	void aSecretPastedWithALineBreakStillMatches() throws Exception {
		var filter = new WebsiteClientAddressFilter(SECRET + "\n");
		var request = new org.springframework.mock.web.MockHttpServletRequest();
		request.setRemoteAddr(WEBSITE_SERVER);
		request.addHeader(WebsiteClientAddressFilter.SECRET_HEADER, SECRET);
		request.addHeader(WebsiteClientAddressFilter.CLIENT_IP_HEADER, "203.0.113.60");
		var seen = new String[1];
		filter.doFilter(request, new org.springframework.mock.web.MockHttpServletResponse(),
				(req, res) -> seen[0] = req.getRemoteAddr());
		assertThat(seen[0]).isEqualTo("203.0.113.60");
	}

	// ---------- helpers ----------

	/** Tests share one database, so each test only reads the audit rows it wrote itself. */
	private long lastAuditId() {
		return jdbc.sql("SELECT COALESCE(MAX(id), 0) FROM audit_log").query(Long.class).single();
	}

	private List<String> clientIpsAuditedAfter(long id) {
		return jdbc.sql("SELECT details->>'clientIp' FROM audit_log WHERE id > ? AND action LIKE 'auth.login.%'")
				.param(id).query(String.class).list();
	}

	private MvcTestResult login(String password, String secret, String visitor) {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		var request = mvc.post().uri("/api/auth/login")
				.with(r -> {
					r.setRemoteAddr(WEBSITE_SERVER);
					return r;
				})
				.cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.header(WebsiteClientAddressFilter.CLIENT_IP_HEADER, visitor)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(DEMO_EMAIL, password));
		if (secret != null) {
			request = request.header(WebsiteClientAddressFilter.SECRET_HEADER, secret);
		}
		return request.exchange();
	}
}
