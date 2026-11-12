package com.sterl.api.payments;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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

import jakarta.servlet.http.Cookie;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Paying someone, end to end against PostgreSQL: the rules decide, money moves only when approved or
 * released, every decision is explained and logged, and a person makes the final call on held payments.
 * (Tests always use the template explainer: application-test.properties blanks the AI key.)
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class PaymentScreeningApiTests {

	private static final String JSON = MediaType.APPLICATION_JSON_VALUE;
	private static final String PASSWORD = "copper kettle river sunrise";

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private Flyway flyway;

	@Autowired
	private ExplanationService explanations;

	@Autowired
	private org.springframework.transaction.support.TransactionTemplate transaction;

	private final JsonMapper json = JsonMapper.builder().build();

	private LoggedIn alex;
	private String account;
	private String oldPayee;

	/** A new customer with £3,000 and a payee saved months ago (so only the rules under test fire). */
	@BeforeEach
	void customerWithMoneyAndAPayee() {
		flyway.clean();
		flyway.migrate();
		alex = signUp("alex.pays@example.com");
		account = jdbc.sql("""
				SELECT a.id::text FROM accounts a JOIN app_users u ON u.customer_id = a.customer_id
				 WHERE u.email = 'alex.pays@example.com'
				""").query(String.class).single();
		assertThat(alex.post("/api/accounts/" + account + "/top-ups").header("Idempotency-Key", key())
				.contentType(JSON).content("{\"amountPence\":300000}")).hasStatus(HttpStatus.CREATED);
		oldPayee = addPayee("alex.pays@example.com", "Jordan Blake", "11-22-33", "12345678", "now() - interval '90 days'");
	}

	@AfterEach
	void leaveItFresh() {
		flyway.clean();
		flyway.migrate();
	}

	// ---------- The rules decide ----------

	@Test
	void anEverydayPaymentIsSentAtOnce() {
		MvcTestResult paid = pay(oldPayee, 2_500, key());
		assertThat(paid).hasStatus(HttpStatus.CREATED).bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.status").isEqualTo("settled");
			assertThat(body).extractingPath("$.message").isEqualTo("Payment sent.");
			assertThat(body).extractingPath("$.payeeName").isEqualTo("Jordan Blake");
		});
		assertThat(balance()).isEqualTo(300_000 - 2_500);
		assertThat(jdbc.sql("SELECT SUM(amount_pence) FROM ledger_entries").query(Long.class).single()).isZero();
	}

	@Test
	void anUnusuallyLargePaymentIsHeldAndNoMoneyMoves() throws Exception {
		MvcTestResult held = pay(oldPayee, 150_000, key());
		assertThat(held).hasStatus(HttpStatus.ACCEPTED).bodyJson().satisfies(body -> {
			assertThat(body).extractingPath("$.status").isEqualTo("held");
			assertThat(body).extractingPath("$.message").asString().contains("paused").contains("Nothing has left your account");
		});
		// The customer is never told the score or which rule fired.
		assertThat(held.getResponse().getContentAsString()).doesNotContain("riskScore").doesNotContain("LARGE");
		assertThat(balance()).isEqualTo(300_000);
		assertThat(jdbc.sql("SELECT rule_hits::text FROM payments").query(String.class).single()).isEqualTo("{LARGE_FOR_THIS_CUSTOMER}");
	}

	@Test
	void theThirdPaymentInTenMinutesIsHeld() {
		assertThat(pay(oldPayee, 1_000, key())).hasStatus(HttpStatus.CREATED);
		assertThat(pay(oldPayee, 1_000, key())).hasStatus(HttpStatus.CREATED);
		assertThat(pay(oldPayee, 1_000, key())).hasStatus(HttpStatus.ACCEPTED);
		assertThat(jdbc.sql("SELECT rule_hits::text FROM payments ORDER BY created_at DESC LIMIT 1").query(String.class).single())
				.isEqualTo("{RAPID_REPEAT}");
	}

	@Test
	void aBrandNewPayeeAloneIsAllowedButExplained() {
		String fresh = addPayee("alex.pays@example.com", "Sam Ortiz", "44-55-66", "87654321", "now()");
		assertThat(pay(fresh, 2_500, key())).hasStatus(HttpStatus.CREATED);
		Map<String, Object> log = jdbc.sql("SELECT explained_by, risk_score, decision FROM ai_audit_logs").query().singleRow();
		assertThat(log).containsEntry("risk_score", 30).containsEntry("decision", "approve").containsEntry("explained_by", "template");
	}

	// ---------- Every decision is logged, and nothing personal goes to the AI ----------

	@Test
	void everyDecisionIsLoggedWithRedactedInputOnly() {
		pay(oldPayee, 150_000, key());
		Map<String, Object> log = jdbc.sql("SELECT decision, risk_score, ai_input::text AS input, reviewer_note FROM ai_audit_logs")
				.query().singleRow();
		assertThat(log).containsEntry("decision", "hold").containsEntry("risk_score", 55);
		String input = (String) log.get("input");
		assertThat(input).contains("£1,500.00");
		for (String personal : new String[] { "Jordan", "Blake", "11-22-33", "12345678", "alex", "Alex", account }) {
			assertThat(input).as("AI input contains " + personal).doesNotContain(personal);
		}
		assertThat((String) log.get("reviewer_note")).contains("much larger than this account's usual payments");
	}

	@Test
	void whatTheAiCanBeShownIsAFixedAllowList() {
		Set<String> fields = Arrays.stream(ExplainerInput.class.getRecordComponents()).map(c -> c.getName()).collect(Collectors.toSet());
		assertThat(fields).containsExactlyInAnyOrder("decision", "riskScore", "amount", "usualPaymentSize", "paymentsLast30Days",
				"paymentsLast10Minutes", "payeeAddedHoursAgo", "payeeType", "reasons");
	}

	@Test
	void ifTheAiFailsTheFixedWordingIsUsedAndTheErrorIsRecorded() {
		String id = body(pay(oldPayee, 150_000, key())).get("id").asString();
		PaymentExplainer broken = new PaymentExplainer() {
			public Explanation explain(ExplainerInput input) {
				throw new IllegalStateException("timeout");
			}
			public String source() {
				return "ai";
			}
			public String model() {
				return "claude-opus-5-5";
			}
		};
		ScreeningFacts facts = new ScreeningFacts(150_000, 0, 0, 0, 2_000, "person");
		Explanation used = explanations.explainWith(broken, UUID.fromString(id), facts, PaymentScreeningRules.screen(facts));

		assertThat(used.customerMessage()).contains("paused");
		Map<String, Object> last = jdbc.sql("SELECT explained_by, error FROM ai_audit_logs ORDER BY id DESC LIMIT 1").query().singleRow();
		assertThat(last).containsEntry("explained_by", "template");
		assertThat((String) last.get("error")).contains("timeout");
	}

	@Test
	void theAiLogCantBeRewritten() {
		pay(oldPayee, 150_000, key());
		org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.sql("UPDATE ai_audit_logs SET risk_score = 0").update())
				.rootCause().hasMessageContaining("append-only");
	}

	// ---------- Safety: exactly once, enough money, only your own ----------

	@Test
	void retryingTheSameRequestNeverPaysTwice() {
		String key = key();
		String first = body(pay(oldPayee, 2_500, key)).get("id").asString();
		MvcTestResult again = pay(oldPayee, 2_500, key);
		assertThat(again).hasStatusOk().hasHeader("Idempotent-Replayed", "true");
		assertThat(body(again).get("id").asString()).isEqualTo(first);
		assertThat(balance()).isEqualTo(300_000 - 2_500);
		assertThat(pay(oldPayee, 9_999, key)).hasStatus(HttpStatus.UNPROCESSABLE_ENTITY);
	}

	@Test
	void youCantPayMoreThanYouHave() {
		assertThat(pay(oldPayee, 300_001, key())).hasStatus(HttpStatus.UNPROCESSABLE_ENTITY);
		assertThat(jdbc.sql("SELECT count(*) FROM payments").query(Long.class).single()).isZero();
	}

	@Test
	void youCanOnlyPayYourOwnPayeesFromYourOwnAccounts() {
		String nikitasPayee = "170e4a48-82fc-4fe9-be13-0564d5482c1f";
		assertThat(pay(nikitasPayee, 100, key())).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(alex.post("/api/payments").header("Idempotency-Key", key()).contentType(JSON).content(
				"{\"fromAccountId\":\"f9312322-42e1-486f-916f-dd42ae894c25\",\"payeeId\":\"%s\",\"amountPence\":100}".formatted(oldPayee)))
				.hasStatus(HttpStatus.NOT_FOUND);
	}

	// ---------- A person makes the final call ----------

	@Test
	void aRiskOfficerReleasesAHeldPaymentAndOnlyThenDoesMoneyMove() {
		String id = body(pay(oldPayee, 150_000, key())).get("id").asString();
		LoggedIn officer = LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);

		assertThat(officer.get("/api/risk/payments/held")).hasStatusOk().bodyJson().satisfies(list -> {
			assertThat(list).extractingPath("$.length()").isEqualTo(1);
			assertThat(list).extractingPath("$[0].riskScore").isEqualTo(55);
			assertThat(list).extractingPath("$[0].reviewerNote").asString().contains("Held with risk score 55");
		});

		assertThat(officer.post("/api/risk/payments/" + id + "/release").contentType(JSON).content("{\"note\":\"Called the customer: genuine house deposit\"}"))
				.hasStatusOk().bodyJson().extractingPath("$.status").isEqualTo("released");
		assertThat(balance()).isEqualTo(300_000 - 150_000);
		assertThat(alex.get("/api/payments/" + id)).bodyJson().extractingPath("$.status").isEqualTo("released");
		assertThat(jdbc.sql("SELECT count(*) FROM audit_log WHERE action = 'payment.released' AND actor = 'staff:morgan.ellis@sterl.example'")
				.query(Long.class).single()).isEqualTo(1L);

		// Decided once: a second release is refused.
		assertThat(officer.post("/api/risk/payments/" + id + "/release").contentType(JSON).content("{\"note\":\"again\"}"))
				.hasStatus(HttpStatus.CONFLICT);
	}

	@Test
	void releasingChecksTheBalanceAgainBecauseMoneyMayHaveBeenSpentSince() {
		String id = body(pay(oldPayee, 150_000, key())).get("id").asString();
		spendByCard(200_000); // £2,000 spent while the £1,500 payment waited: only £1,000 left
		LoggedIn officer = LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);
		assertThat(officer.post("/api/risk/payments/" + id + "/release").contentType(JSON).content("{\"note\":\"ok\"}"))
				.hasStatus(HttpStatus.CONFLICT)
				.bodyJson().extractingPath("$.detail").asString().contains("no longer has enough money");
		assertThat(balance()).isEqualTo(100_000);
	}

	@Test
	void aRejectedPaymentNeverMovesMoney() {
		String id = body(pay(oldPayee, 150_000, key())).get("id").asString();
		LoggedIn officer = LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);
		assertThat(officer.post("/api/risk/payments/" + id + "/reject").contentType(JSON).content("{\"note\":\"Customer reported a scam call\"}"))
				.hasStatusOk().bodyJson().extractingPath("$.status").isEqualTo("rejected");
		assertThat(balance()).isEqualTo(300_000);
		assertThat(officer.post("/api/risk/payments/" + id + "/release").contentType(JSON).content("{}")).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void customersCantReviewAndStaffCantPay() {
		assertThat(alex.get("/api/risk/payments/held")).hasStatus(HttpStatus.FORBIDDEN);
		LoggedIn officer = LoggedIn.as(mvc, LoggedIn.RISK_OFFICER_EMAIL, LoggedIn.RISK_OFFICER_PASSWORD);
		assertThat(officer.post("/api/payments").header("Idempotency-Key", key()).contentType(JSON)
				.content("{\"fromAccountId\":\"%s\",\"payeeId\":\"%s\",\"amountPence\":100}".formatted(account, oldPayee)))
				.hasStatus(HttpStatus.FORBIDDEN);
	}

	// ---------- helpers ----------

	private MvcTestResult pay(String payeeId, long pence, String idempotencyKey) {
		return alex.post("/api/payments").header("Idempotency-Key", idempotencyKey).contentType(JSON)
				.content("{\"fromAccountId\":\"%s\",\"payeeId\":\"%s\",\"amountPence\":%d}".formatted(account, payeeId, pence))
				.exchange();
	}

	private long balance() {
		return jdbc.sql("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries WHERE account_id = CAST(:id AS uuid)")
				.param("id", account).query(Long.class).single();
	}

	/** A card payment straight into the ledger (double entry: the account down, CARD_SETTLEMENT up). */
	private void spendByCard(long pence) {
		// One database transaction: the ledger checks at COMMIT that the two legs sum to zero.
		transaction.executeWithoutResult(status -> spendLegs(pence));
	}

	private void spendLegs(long pence) {
		String tx = UUID.randomUUID().toString();
		jdbc.sql("INSERT INTO ledger_transactions (id, kind, description, category, occurred_at) VALUES (CAST(:tx AS uuid), 'card', 'Corner Fresh', 'Groceries', now())")
				.param("tx", tx).update();
		jdbc.sql("""
				INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence) VALUES
				    (gen_random_uuid(), CAST(:tx AS uuid), CAST(:account AS uuid), -CAST(:p AS bigint)),
				    (gen_random_uuid(), CAST(:tx AS uuid), '00000000-0000-4000-8000-000000000002', CAST(:p AS bigint))
				""").param("tx", tx).param("account", account).param("p", pence).update();
	}

	private String addPayee(String customerEmail, String name, String sortCode, String accountNumber, String createdAtSql) {
		String id = UUID.randomUUID().toString();
		jdbc.sql("""
				INSERT INTO payees (id, customer_id, name, type, sort_code, account_number, created_at)
				SELECT CAST(:id AS uuid), customer_id, :name, 'person', :sort, :number, %s FROM app_users WHERE email = :email
				""".formatted(createdAtSql))
				.param("id", id).param("name", name).param("sort", sortCode).param("number", accountNumber).param("email", customerEmail)
				.update();
		return id;
	}

	private LoggedIn signUp(String email) {
		Cookie csrf = LoggedIn.csrfCookie(mvc, null);
		String body = json.writeValueAsString(Map.of("firstName", "Alex", "lastName", "Example", "email", email, "password", PASSWORD));
		assertThat(mvc.post().uri("/api/auth/signup").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(JSON).content(body)).hasStatus(HttpStatus.CREATED);
		return LoggedIn.as(mvc, email, PASSWORD);
	}

	private JsonNode body(MvcTestResult result) {
		return json.readTree(result.getResponse().getContentAsByteArray());
	}

	private static String key() {
		return UUID.randomUUID().toString();
	}
}
