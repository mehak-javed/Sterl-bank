package com.sterl.api.payees;

import static org.assertj.core.api.Assertions.assertThat;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.sterl.api.support.Fixtures;
import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

/** Saved payees: your own only, the account number never sent back in full, and checked input. */
@SterlIntegrationTest
@AutoConfigureMockMvc
class PayeeApiTests {

	private static final String JSON = MediaType.APPLICATION_JSON_VALUE;

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private Flyway flyway;

	@BeforeEach
	@AfterEach
	void freshBank() {
		flyway.clean();
		flyway.migrate();
	}

	@Test
	void youSeeYourOwnPayeesWithOnlyTheLastFourDigits() throws Exception {
		LoggedIn nikita = LoggedIn.asDemoCustomer(mvc);
		var result = nikita.get("/api/payees").exchange();
		assertThat(result).hasStatusOk().bodyJson().extractingPath("$.length()").isEqualTo(Fixtures.read("payees.json").size());
		assertThat(result).bodyJson().extractingPath("$[0].accountNumberLast4").asString().hasSize(4);
		// The full 8-digit number of the first seeded payee never leaves the server.
		assertThat(result.getResponse().getContentAsString()).doesNotContain("03376841").doesNotContain("accountNumber\"");

		LoggedIn tomas = LoggedIn.as(mvc, LoggedIn.TOMAS_EMAIL, LoggedIn.TOMAS_PASSWORD);
		assertThat(tomas.get("/api/payees")).hasStatusOk().bodyJson().extractingPath("$.length()").isEqualTo(0);
	}

	@Test
	void addingAPayeeSavesItOnceAndChecksTheDetails() {
		LoggedIn tomas = LoggedIn.as(mvc, LoggedIn.TOMAS_EMAIL, LoggedIn.TOMAS_PASSWORD);
		String sam = "{\"name\":\"  Sam   Ortiz \",\"type\":\"person\",\"sortCode\":\"44-55-66\",\"accountNumber\":\"87654321\"}";
		assertThat(tomas.post("/api/payees").contentType(JSON).content(sam)).hasStatus(HttpStatus.CREATED).bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.name").isEqualTo("Sam Ortiz");
			assertThat(body).extractingPath("$.accountNumberLast4").isEqualTo("4321");
		});
		assertThat(tomas.post("/api/payees").contentType(JSON).content(sam)).hasStatus(HttpStatus.CONFLICT);

		assertThat(tomas.post("/api/payees").contentType(JSON)
				.content("{\"name\":\"\",\"type\":\"robot\",\"sortCode\":\"445566\",\"accountNumber\":\"123\"}"))
				.hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(body -> {
					assertThat(body).extractingPath("$.errors.sortCode").isEqualTo("Enter a sort code like 12-34-56");
					assertThat(body).extractingPath("$.errors.accountNumber").isEqualTo("Enter an 8-digit account number");
					assertThat(body).extractingPath("$.errors.type").isEqualTo("Choose person or business");
				});
	}

	@Test
	void staffDontSeeCustomersPayees() {
		LoggedIn officer = LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);
		assertThat(officer.get("/api/payees")).hasStatus(HttpStatus.FORBIDDEN);
	}
}
