package com.sterl.api.cards;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

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

import com.sterl.api.support.Fixtures;
import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

import jakarta.servlet.http.Cookie;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Cards against a real PostgreSQL: saved cards come back on every login, a new customer starts with
 * none and can add one, freezing is saved and audited, and nobody can see or touch another
 * customer's card.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class CardApiTests {

	private static final String NIKITA_DEBIT = "b0422f68-b03d-4d55-8c41-4607b817b005";
	private static final String NEW_PASSWORD = "copper kettle river sunrise";
	private static final String JSON = MediaType.APPLICATION_JSON_VALUE;

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private Flyway flyway;

	@Autowired
	private Clock clock;

	private final JsonMapper json = JsonMapper.builder().build();

	/** These tests add and freeze cards, so each starts from the freshly seeded bank. */
	@BeforeEach
	void freshBank() {
		flyway.clean();
		flyway.migrate();
	}

	@AfterEach
	void leaveItFresh() {
		flyway.clean();
		flyway.migrate();
	}

	// ---------- Existing customers: saved cards come back ----------

	@Test
	void anExistingCustomerGetsTheirSavedCardsExactlyAsTheWebsiteFixturesHaveThem() {
		LoggedIn nikita = LoggedIn.asDemoCustomer(mvc);
		JsonNode cards = body(nikita.get("/api/cards"));
		JsonNode expected = Fixtures.read("cards.json");

		assertThat(cards.size()).isEqualTo(expected.size()).isEqualTo(4);
		for (int i = 0; i < expected.size(); i++) {
			for (String field : List.of("id", "accountId", "product", "brand", "nameOnCard", "last4",
					"expiryMonth", "expiryYear", "frozen")) {
				assertThat(cards.get(i).get(field).asString()).as("card %d %s", i, field)
						.isEqualTo(expected.get(i).get(field).asString());
			}
		}
	}

	@Test
	void aFreezeIsSavedSoItIsStillFrozenAtTheNextLogin() {
		assertThat(LoggedIn.asDemoCustomer(mvc).patch("/api/cards/" + NIKITA_DEBIT)
				.contentType(JSON).content("{\"frozen\":true}"))
				.hasStatusOk().bodyJson().extractingPath("$.frozen").isEqualTo(true);

		LoggedIn later = LoggedIn.asDemoCustomer(mvc); // a brand-new session
		assertThat(later.get("/api/cards/" + NIKITA_DEBIT)).hasStatusOk()
				.bodyJson().extractingPath("$.frozen").isEqualTo(true);
	}

	// ---------- New customers: no cards, then add one ----------

	@Test
	void aNewCustomerStartsWithNoCardsThenAddsOne() {
		LoggedIn alex = signUp("Alex", "Example", "alex.cards@example.com");
		assertThat(alex.get("/api/cards")).hasStatusOk().bodyJson().extractingPath("$.length()").isEqualTo(0);

		MvcTestResult issued = alex.post("/api/cards").contentType(JSON).content("{\"product\":\"virtual\"}").exchange();

		YearMonth expiry = YearMonth.now(clock).plusYears(3);
		assertThat(issued).hasStatus(HttpStatus.CREATED).bodyJson().satisfies(card -> {
			assertThat(card).extractingPath("$.product").isEqualTo("virtual");
			assertThat(card).extractingPath("$.brand").isEqualTo("Visa"); // decided by the product
			assertThat(card).extractingPath("$.last4").isEqualTo("5556"); // a published test number
			assertThat(card).extractingPath("$.nameOnCard").isEqualTo("ALEX EXAMPLE");
			assertThat(card).extractingPath("$.expiryMonth").isEqualTo(expiry.getMonthValue());
			assertThat(card).extractingPath("$.expiryYear").isEqualTo(expiry.getYear());
			assertThat(card).extractingPath("$.frozen").isEqualTo(false);
		});
		String id = body(issued).get("id").asString();
		assertThat(issued.getResponse().getHeader("Location")).isEqualTo("/api/cards/" + id);

		// The card has its OWN account, named after it, opened with money and a few payments.
		JsonNode accounts = body(alex.get("/api/accounts"));
		assertThat(accounts.size()).isEqualTo(2); // Everyday Account + Virtual Card
		JsonNode cardAccount = null;
		for (JsonNode a : accounts) {
			if (a.get("id").asString().equals(body(issued).get("accountId").asString())) {
				cardAccount = a;
			}
		}
		assertThat(cardAccount).isNotNull();
		assertThat(cardAccount.get("name").asString()).isEqualTo("Virtual Card");

		StarterActivity.Plan plan = StarterActivity.plan(java.util.UUID.fromString(id), CardProduct.VIRTUAL, clock.instant());
		assertThat(cardAccount.get("balancePence").asLong()).isEqualTo(plan.balancePence()).isPositive();
		assertThat(alex.get("/api/accounts/" + cardAccount.get("id").asString() + "/transactions"))
				.bodyJson().extractingPath("$.totalItems").isEqualTo(1 + plan.payments().size());

		// Real double entry: the whole ledger still sums to zero.
		assertThat(jdbc.sql("SELECT SUM(amount_pence) FROM ledger_entries").query(Long.class).single()).isZero();
		assertThat(alex.get("/api/cards")).bodyJson().extractingPath("$.length()").isEqualTo(1);
		assertThat(auditCount("card.issued", id)).isEqualTo(1);
	}

	@Test
	void twoPeopleAddingTheSameCardGetDifferentMoney() {
		LoggedIn one = signUp("Ana", "One", "ana.one@example.com");
		LoggedIn two = signUp("Ben", "Two", "ben.two@example.com");
		long first = balanceOfNewCard(one, "travel");
		long second = balanceOfNewCard(two, "travel");
		assertThat(first).isPositive().isNotEqualTo(second);
	}

	@Test
	void theSameCardCantBeAddedTwice() {
		LoggedIn bea = signUp("Bea", "Twice", "bea.cards@example.com");
		assertThat(bea.post("/api/cards").contentType(JSON).content("{\"product\":\"debit\"}")).hasStatus(HttpStatus.CREATED);
		assertThat(bea.post("/api/cards").contentType(JSON).content("{\"product\":\"debit\"}"))
				.hasStatus(HttpStatus.CONFLICT)
				.bodyJson().extractingPath("$.detail").isEqualTo("You already have this card.");
	}

	@Test
	void onlyRealProductsAndNoExtraFieldsAreAccepted() {
		LoggedIn cy = signUp("Cy", "Strict", "cy.cards@example.com");
		assertThat(cy.post("/api/cards").contentType(JSON).content("{\"product\":\"platinum\"}")).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(cy.post("/api/cards").contentType(JSON).content("{}")).hasStatus(HttpStatus.BAD_REQUEST);
		// The caller can't choose the account (or anything else): unknown fields are refused.
		String sneaky = "{\"product\":\"debit\",\"accountId\":\"" + Fixtures.EVERYDAY_ACCOUNT + "\"}";
		assertThat(cy.post("/api/cards").contentType(JSON).content(sneaky)).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(jdbc.sql("SELECT count(*) FROM cards").query(Long.class).single()).isEqualTo(8L); // only the seeded ones
	}

	// ---------- Freezing ----------

	@Test
	void freezingTwiceIsHarmlessAndAuditedOnce() {
		LoggedIn nikita = LoggedIn.asDemoCustomer(mvc);
		for (int i = 0; i < 2; i++) {
			assertThat(nikita.patch("/api/cards/" + NIKITA_DEBIT).contentType(JSON).content("{\"frozen\":true}")).hasStatusOk();
		}
		assertThat(auditCount("card.frozen", NIKITA_DEBIT)).isEqualTo(1);

		assertThat(nikita.patch("/api/cards/" + NIKITA_DEBIT).contentType(JSON).content("{\"frozen\":false}"))
				.hasStatusOk().bodyJson().extractingPath("$.frozen").isEqualTo(false);
		assertThat(auditCount("card.unfrozen", NIKITA_DEBIT)).isEqualTo(1);
	}

	@Test
	void freezingNeedsAnExplicitTrueOrFalse() {
		LoggedIn nikita = LoggedIn.asDemoCustomer(mvc);
		assertThat(nikita.patch("/api/cards/" + NIKITA_DEBIT).contentType(JSON).content("{}")).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(nikita.patch("/api/cards/" + NIKITA_DEBIT).contentType(JSON).content("{\"frozen\":\"yes\"}"))
				.hasStatus(HttpStatus.BAD_REQUEST);
	}

	// ---------- Isolation and security ----------

	@Test
	void anotherCustomersCardDoesNotExistForYou() {
		LoggedIn tomas = LoggedIn.as(mvc, LoggedIn.TOMAS_EMAIL, LoggedIn.TOMAS_PASSWORD);

		JsonNode own = body(tomas.get("/api/cards"));
		assertThat(own.size()).isEqualTo(1);
		assertThat(own.get(0).get("nameOnCard").asString()).isEqualTo("TOMAS REYES");

		assertThat(tomas.get("/api/cards/" + NIKITA_DEBIT)).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(tomas.patch("/api/cards/" + NIKITA_DEBIT).contentType(JSON).content("{\"frozen\":true}"))
				.hasStatus(HttpStatus.NOT_FOUND);
		// ...and Nikita's card really wasn't touched.
		assertThat(jdbc.sql("SELECT frozen FROM cards WHERE id = CAST(:id AS uuid)").param("id", NIKITA_DEBIT)
				.query(Boolean.class).single()).isFalse();
	}

	@Test
	void cardsNeedALoginAndChangesNeedTheCsrfToken() {
		assertThat(mvc.get().uri("/api/cards")).hasStatus(HttpStatus.UNAUTHORIZED);

		Cookie session = LoggedIn.asDemoCustomer(mvc).sessionCookie();
		assertThat(mvc.patch().uri("/api/cards/" + NIKITA_DEBIT).cookie(session).contentType(JSON).content("{\"frozen\":true}"))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	// ---------- Rules the database enforces on its own ----------

	@Test
	void theDatabaseRefusesCardsOnInternalAccountsAndImpossibleProductNetworkPairs() {
		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO cards (id, account_id, product, brand, details_encrypted)
				VALUES (gen_random_uuid(), CAST(:account AS uuid), 'virtual', 'Visa', 'enc:v1:x')
				""").param("account", Fixtures.CARD_SETTLEMENT_ACCOUNT).update())
				.hasMessageContaining("cards can only be issued on customer accounts");

		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO cards (id, account_id, product, brand, details_encrypted)
				VALUES (gen_random_uuid(), CAST(:account AS uuid), 'travel', 'Visa', 'enc:v1:x')
				""").param("account", Fixtures.EVERYDAY_ACCOUNT).update())
				.hasMessageContaining("cards_brand_matches_product");
	}

	@Test
	void longNamesAreCutToFitOnTheCard() {
		assertThat(CardService.nameOnCard("  Maximilian   Alexander-Worthington ")).isEqualTo("MAXIMILIAN ALEXANDER-WORTH");
		assertThat(CardService.nameOnCard("Alex Example")).isEqualTo("ALEX EXAMPLE");
	}

	// ---------- helpers ----------

	/** Opens a brand-new account through the API (logged straight in), and returns that browser. */
	private LoggedIn signUp(String first, String last, String email) {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		String body = json.writeValueAsString(Map.of("firstName", first, "lastName", last, "email", email, "password", NEW_PASSWORD));
		assertThat(mvc.post().uri("/api/auth/signup").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(JSON).content(body)).hasStatus(HttpStatus.CREATED);
		return LoggedIn.as(mvc, email, NEW_PASSWORD);
	}

	private long balanceOfNewCard(LoggedIn who, String product) {
		String accountId = body(who.post("/api/cards").contentType(JSON).content("{\"product\":\"" + product + "\"}")).get("accountId").asString();
		return body(who.get("/api/accounts/" + accountId)).get("balancePence").asLong();
	}

	private JsonNode body(MockMvcTester.MockMvcRequestBuilder request) {
		return body(request.exchange());
	}

	private JsonNode body(MvcTestResult result) {
		return json.readTree(result.getResponse().getContentAsByteArray());
	}

	private long auditCount(String action, String cardId) {
		return jdbc.sql("SELECT count(*) FROM audit_log WHERE action = :action AND entity_type = 'card' AND entity_id = :id")
				.param("action", action).param("id", cardId).query(Long.class).single();
	}
}
