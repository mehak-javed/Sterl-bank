package com.sterl.api.transfers;

import static com.sterl.api.support.Fixtures.CARD_SETTLEMENT_ACCOUNT;
import static com.sterl.api.support.Fixtures.EVERYDAY_ACCOUNT;
import static com.sterl.api.support.Fixtures.ROUNDUP_ACCOUNT;
import static com.sterl.api.support.Fixtures.SAVER_ACCOUNT;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
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

import com.sterl.api.support.SterlIntegrationTest;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Safe transfers, proved: money moves exactly once, never overdraws, never deadlocks, and always
 * leaves balanced ledger entries plus an audit record. Real HTTP through Spring MVC, real PostgreSQL.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class TransferApiTests {

	private static final long EVERYDAY_BALANCE = 125_000; // £1,250.00 in the seed
	private static final long SAVER_BALANCE = 480_000;    // £4,800.00
	private static final long ROUNDUP_BALANCE = 26_165;   // £261.65
	private static final long SEEDED_LEDGER_TRANSACTIONS = 618;

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private Flyway flyway;

	private final JsonMapper json = JsonMapper.builder().build();

	/** These tests move money, so every test starts (and ends) with the freshly seeded bank. */
	@BeforeEach
	@AfterEach
	void freshBank() {
		flyway.clean();
		flyway.migrate();
	}

	// ---------- The happy path ----------

	@Test
	void movesMoneyBetweenOwnAccountsAndReturns201() {
		MvcTestResult result = post(newKey(), body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 5_000, "Holiday"));

		assertThat(result).hasStatus(HttpStatus.CREATED);
		JsonNode transfer = read(result);
		assertThat(result.getResponse().getHeader("Location")).isEqualTo("/api/transfers/" + transfer.get("id").asString());
		assertThat(transfer.get("amountPence").asLong()).isEqualTo(5_000);
		assertThat(transfer.get("description").asString()).isEqualTo("Holiday");
		assertThat(transfer.get("fromBalanceAfterPence").asLong()).isEqualTo(EVERYDAY_BALANCE - 5_000);
		assertThat(transfer.get("toBalanceAfterPence").asLong()).isEqualTo(SAVER_BALANCE + 5_000);

		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE - 5_000);
		assertThat(balance(SAVER_ACCOUNT)).isEqualTo(SAVER_BALANCE + 5_000);
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS + 1);
		assertThat(wholeLedgerTotal()).isZero(); // double entry: still sums to zero

		// The Location header really leads to it.
		assertThat(mvc.get().uri(result.getResponse().getHeader("Location"))).hasStatusOk()
				.bodyJson().extractingPath("$.id").isEqualTo(transfer.get("id").asString());
	}

	@Test
	void withoutAReferenceTheDescriptionNamesTheDestination() {
		JsonNode transfer = read(post(newKey(), body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 100, null)));
		assertThat(transfer.get("description").asString()).isEqualTo("Transfer to Rainy Day Saver");
	}

	@Test
	void everyTransferWritesAnAuditRecordInTheSameTransaction() {
		String key = newKey();
		JsonNode transfer = read(post(key, body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 2_500, null)));

		Map<String, Object> audit = jdbc.sql("""
				SELECT actor, action, details->>'amountPence' AS amount, details->>'idempotencyKey' AS key
				  FROM audit_log WHERE entity_id = :id
				""").param("id", transfer.get("id").asString()).query().singleRow();
		assertThat(audit.get("actor")).isEqualTo("customer:0d9b0fd3-2248-4649-9245-7c3890921ffc");
		assertThat(audit.get("action")).isEqualTo("transfer.created");
		assertThat(audit.get("amount")).isEqualTo("2500");
		assertThat(audit.get("key")).isEqualTo(key);
	}

	@Test
	void theNewTransferIsAtTheTopOfTheStatementWithTheRightBalance() {
		read(post(newKey(), body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 1_000, "Rent pot")));

		assertThat(mvc.get().uri("/api/accounts/" + EVERYDAY_ACCOUNT + "/transactions?size=1"))
				.bodyJson()
				.satisfies(page -> {
					assertThat(page).extractingPath("$.items[0].description").isEqualTo("Rent pot");
					assertThat(page).extractingPath("$.items[0].amountPence").isEqualTo(-1_000);
					assertThat(page).extractingPath("$.items[0].balanceAfterPence").isEqualTo(124_000);
				});
	}

	// ---------- Idempotency: the same request twice moves money once ----------

	@Test
	void resendingTheSameKeyAndRequestReplaysTheOriginalResult() {
		String key = newKey();
		String request = body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 5_000, null);

		MvcTestResult first = post(key, request);
		MvcTestResult retry = post(key, request);

		assertThat(first).hasStatus(HttpStatus.CREATED);
		assertThat(retry).hasStatusOk().hasHeader("Idempotent-Replayed", "true");
		assertThat(read(retry)).isEqualTo(read(first)); // identical, including the balances after
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE - 5_000); // moved ONCE
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS + 1);
	}

	@Test
	void reusingAKeyForADifferentTransferIsRejected() {
		String key = newKey();
		post(key, body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 5_000, null));

		MvcTestResult reused = post(key, body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 9_999, null));

		assertThat(reused).hasStatus(422)
				.bodyJson().extractingPath("$.detail").asString().contains("already used for a different transfer");
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE - 5_000);
	}

	@Test
	void tenIdenticalRequestsAtTheSameMomentMoveMoneyOnce() throws Exception {
		String key = newKey();
		String request = body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 5_000, null);

		List<MvcTestResult> results = inParallel(10, i -> post(key, request));

		Map<Integer, Long> statuses = countStatuses(results);
		assertThat(statuses).containsExactlyInAnyOrderEntriesOf(Map.of(201, 1L, 200, 9L));
		assertThat(results.stream().map(r -> read(r).get("id").asString()).distinct()).hasSize(1);
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE - 5_000);
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS + 1);
	}

	// ---------- Concurrency: no overdrafts, no deadlocks ----------

	@Test
	void parallelTransfersCanNeverOverdrawAnAccount() throws Exception {
		// The Round-up Pot holds £261.65. Twenty £20 transfers race for it: exactly 13 fit.
		List<MvcTestResult> results = inParallel(20, i -> post(newKey(), body(ROUNDUP_ACCOUNT, EVERYDAY_ACCOUNT, 2_000, null)));

		Map<Integer, Long> statuses = countStatuses(results);
		assertThat(statuses).containsExactlyInAnyOrderEntriesOf(Map.of(201, 13L, 422, 7L));
		assertThat(balance(ROUNDUP_ACCOUNT)).isEqualTo(ROUNDUP_BALANCE - 13 * 2_000).isNotNegative();
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE + 13 * 2_000);
		assertThat(wholeLedgerTotal()).isZero();
	}

	@Test
	void transfersInOppositeDirectionsAtOnceDontDeadlock() throws Exception {
		// Without locking in a fixed order, A→B and B→A could each hold one account and wait forever.
		List<MvcTestResult> results = inParallel(20, i -> i % 2 == 0
				? post(newKey(), body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 100, null))
				: post(newKey(), body(SAVER_ACCOUNT, EVERYDAY_ACCOUNT, 100, null)));

		assertThat(countStatuses(results)).containsExactlyEntriesOf(Map.of(201, 20L));
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE); // 10 out, 10 in
		assertThat(balance(SAVER_ACCOUNT)).isEqualTo(SAVER_BALANCE);
	}

	// ---------- Refusals leave no trace ----------

	@Test
	void notEnoughMoneyIsA422AndNothingChanges() {
		String key = newKey();
		MvcTestResult result = post(key, body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 200_000, null));

		assertThat(result).hasStatus(422).bodyJson().extractingPath("$.detail").asString()
				.contains("isn't enough money in Everyday Account").contains("£1,250.00").contains("£2,000.00");
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE);
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS);

		// The whole transaction rolled back, including the key: it can be used for a corrected transfer.
		assertThat(post(key, body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 20_000, null))).hasStatus(HttpStatus.CREATED);
	}

	@Test
	void accountsThatArentTheCustomersAreA404() {
		assertThat(post(newKey(), body(EVERYDAY_ACCOUNT, CARD_SETTLEMENT_ACCOUNT, 100, null)))
				.hasStatus(HttpStatus.NOT_FOUND); // the bank's internal account
		assertThat(post(newKey(), body(EVERYDAY_ACCOUNT, "7f000000-0000-4000-8000-000000000000", 100, null)))
				.hasStatus(HttpStatus.NOT_FOUND);
		assertThat(balance(EVERYDAY_ACCOUNT)).isEqualTo(EVERYDAY_BALANCE);
	}

	@Test
	void anUnknownTransferIsA404() {
		assertThat(mvc.get().uri("/api/transfers/" + UUID.randomUUID())).hasStatus(HttpStatus.NOT_FOUND);
	}

	// ---------- Bad input is rejected, never guessed at ----------

	@Test
	void badRequestsAre400sAndMoveNoMoney() {
		Map<String, String> badBodies = Map.ofEntries(
				Map.entry("zero", body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 0, null)),
				Map.entry("negative", body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, -500, null)),
				Map.entry("over the limit", body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 1_000_001, null)),
				Map.entry("same account", body(EVERYDAY_ACCOUNT, EVERYDAY_ACCOUNT, 100, null)),
				Map.entry("reference too long", body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 100, "x".repeat(19))),
				Map.entry("reference with markup", body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 100, "<script>")),
				// Money is never rounded or guessed:
				Map.entry("decimal amount", raw("12.99")),
				Map.entry("amount as text", raw("\"100\"")),
				Map.entry("missing amount", "{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\"}".formatted(EVERYDAY_ACCOUNT, SAVER_ACCOUNT)),
				Map.entry("misspelt field", "{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\",\"ammountPence\":100}".formatted(EVERYDAY_ACCOUNT, SAVER_ACCOUNT)),
				Map.entry("not JSON", "transfer please"));

		badBodies.forEach((name, badBody) -> assertThat(post(newKey(), badBody)).as(name)
				.hasStatus(HttpStatus.BAD_REQUEST)
				.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS);
	}

	@Test
	void theIdempotencyKeyIsRequiredAndChecked() {
		String request = body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 100, null);

		assertThat(mvc.post().uri("/api/transfers").contentType(MediaType.APPLICATION_JSON).content(request))
				.hasStatus(HttpStatus.BAD_REQUEST); // no header
		assertThat(post("short", request)).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(post("has spaces in it", request)).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(ledgerTransactions()).isEqualTo(SEEDED_LEDGER_TRANSACTIONS);
	}

	@Test
	void validationErrorsNameTheField() {
		assertThat(post(newKey(), body(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, 0, null)))
				.bodyJson().extractingPath("$.detail").isEqualTo("amountPence: must be greater than 0");
	}

	// ---------- helpers ----------

	private MvcTestResult post(String key, String requestBody) {
		return mvc.post().uri("/api/transfers")
				.header("Idempotency-Key", key)
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody)
				.exchange();
	}

	private static String newKey() {
		return UUID.randomUUID().toString();
	}

	private static String body(String from, String to, long amountPence, String reference) {
		String ref = reference == null ? "" : ",\"reference\":\"" + reference + "\"";
		return "{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\",\"amountPence\":%d%s}".formatted(from, to, amountPence, ref);
	}

	/** A body whose amountPence is written exactly as given, e.g. 12.99 or "100". */
	private static String raw(String amountJson) {
		return "{\"fromAccountId\":\"%s\",\"toAccountId\":\"%s\",\"amountPence\":%s}".formatted(EVERYDAY_ACCOUNT, SAVER_ACCOUNT, amountJson);
	}

	private JsonNode read(MvcTestResult result) {
		try {
			return json.readTree(result.getResponse().getContentAsString());
		} catch (java.io.UnsupportedEncodingException e) {
			throw new IllegalStateException(e);
		}
	}

	private long balance(String accountId) {
		return jdbc.sql("SELECT balance_pence FROM account_balances WHERE account_id = ?::uuid")
				.param(accountId).query(Long.class).single();
	}

	private long ledgerTransactions() {
		return jdbc.sql("SELECT COUNT(*) FROM ledger_transactions").query(Long.class).single();
	}

	private long wholeLedgerTotal() {
		return jdbc.sql("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries").query(Long.class).single();
	}

	private static Map<Integer, Long> countStatuses(List<MvcTestResult> results) {
		return results.stream().collect(Collectors.groupingBy(r -> r.getResponse().getStatus(), Collectors.counting()));
	}

	@FunctionalInterface
	private interface Request {
		MvcTestResult send(int index) throws Exception;
	}

	/**
	 * Fires {@code count} requests at the SAME moment: every thread waits at the start line
	 * (a latch), then they all go at once, so they really overlap inside the database.
	 */
	private static List<MvcTestResult> inParallel(int count, Request request) throws Exception {
		ExecutorService pool = Executors.newFixedThreadPool(count);
		try {
			CountDownLatch startLine = new CountDownLatch(1);
			List<Future<MvcTestResult>> futures = new ArrayList<>();
			for (int i = 0; i < count; i++) {
				int index = i;
				Callable<MvcTestResult> task = () -> {
					startLine.await();
					return request.send(index);
				};
				futures.add(pool.submit(task));
			}
			startLine.countDown();
			List<MvcTestResult> results = new ArrayList<>();
			for (Future<MvcTestResult> future : futures) {
				results.add(future.get(30, TimeUnit.SECONDS)); // a deadlock would show up as a timeout or a 500
			}
			return results;
		} finally {
			pool.shutdownNow();
		}
	}
}
