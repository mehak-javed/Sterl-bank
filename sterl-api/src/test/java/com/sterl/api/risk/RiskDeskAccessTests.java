package com.sterl.api.risk;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

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

/**
 * Who may use the Credit Risk desk, in both directions:
 * customers never see the bank's lending book, and staff never see customers' money.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class RiskDeskAccessTests {

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	private LoggedIn riskOfficer() {
		return LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);
	}

	@Test
	void aRiskOfficerCanOpenTheDesk() {
		assertThat(riskOfficer().get("/api/risk/desk")).hasStatusOk().bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.email").isEqualTo("morgan.ellis@sterl.example");
			assertThat(body).extractingPath("$.role").isEqualTo("risk_officer");
		});
	}

	@Test
	void aRiskOfficerIsStaffNotACustomer() {
		assertThat(riskOfficer().get("/api/auth/me")).hasStatusOk().bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.role").isEqualTo("risk_officer");
			assertThat(body).extractingPath("$.customerId").isNull();
		});
	}

	@Test
	void customersCantOpenTheDesk() {
		assertThat(LoggedIn.asDemoCustomer(mvc).get("/api/risk/desk")).hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void nobodyLoggedOutCanOpenTheDesk() {
		assertThat(mvc.get().uri("/api/risk/desk")).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void staffCantReadCustomersAccountsCardsOrPayments() {
		LoggedIn staff = riskOfficer();
		assertThat(staff.get("/api/accounts")).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(staff.get("/api/accounts/" + Fixtures.EVERYDAY_ACCOUNT)).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(staff.get("/api/accounts/" + Fixtures.EVERYDAY_ACCOUNT + "/transactions")).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(staff.get("/api/cards")).hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void staffCantMoveCustomersMoneyOrAddCards() {
		LoggedIn staff = riskOfficer();
		assertThat(staff.post("/api/transfers").header("Idempotency-Key", UUID.randomUUID().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\",\"amountPence\":100}"
						.formatted(Fixtures.EVERYDAY_ACCOUNT, Fixtures.SAVER_ACCOUNT)))
				.hasStatus(HttpStatus.FORBIDDEN);
		assertThat(staff.post("/api/accounts/" + Fixtures.EVERYDAY_ACCOUNT + "/top-ups")
				.header("Idempotency-Key", UUID.randomUUID().toString())
				.contentType(MediaType.APPLICATION_JSON).content("{\"amountPence\":100}"))
				.hasStatus(HttpStatus.FORBIDDEN);
		assertThat(staff.post("/api/cards").contentType(MediaType.APPLICATION_JSON).content("{\"product\":\"virtual\"}"))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void staffLoginsAreAuditedLikeCustomerLogins() {
		riskOfficer();
		assertThat(jdbc.sql("""
				SELECT count(*) FROM audit_log
				 WHERE action = 'auth.login.succeeded' AND entity_id = 'morgan.ellis@sterl.example'
				""").query(Long.class).single()).isPositive();
	}
}
