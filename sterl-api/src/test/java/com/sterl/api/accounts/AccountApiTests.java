package com.sterl.api.accounts;

import static com.sterl.api.support.Fixtures.CARD_SETTLEMENT_ACCOUNT;
import static com.sterl.api.support.Fixtures.EVERYDAY_ACCOUNT;
import static com.sterl.api.support.Fixtures.ROUNDUP_ACCOUNT;
import static com.sterl.api.support.Fixtures.SAVER_ACCOUNT;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.sterl.api.support.Fixtures;
import com.sterl.api.support.SterlIntegrationTest;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The accounts API end to end: real HTTP requests through Spring MVC, real SQL against the
 * seeded PostgreSQL. Expected numbers come from the front end's fixtures, never typed in by hand.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class AccountApiTests {

	private static final ZoneId UK = ZoneId.of("Europe/London");

	/** Everyday Account: 615 fixture transactions plus its opening-balance entry. */
	private static final int EVERYDAY_ENTRIES = Fixtures.transactionsOf(EVERYDAY_ACCOUNT).size() + 1;

	@Autowired
	private MockMvcTester mvc;

	private final JsonMapper json = JsonMapper.builder().build();

	// ---------- GET /api/accounts ----------

	@Test
	void listsTheCustomersThreeAccountsWithBalancesFromTheLedger() {
		JsonNode accounts = getOk("/api/accounts");

		assertThat(accounts.size()).isEqualTo(3);
		Map<String, Long> expected = new HashMap<>();
		for (JsonNode a : Fixtures.read("accounts.json")) {
			expected.put(a.get("id").asString(), a.get("balancePence").asLong());
		}
		for (JsonNode a : accounts) {
			assertThat(a.get("type").asString()).isNotEqualTo("internal");
			assertThat(a.get("balancePence").asLong()).as(a.get("name").asString())
					.isEqualTo(expected.get(a.get("id").asString()));
		}
		assertThat(accounts.get(0).get("name").asString()).isEqualTo("Everyday Account"); // current account first
	}

	// ---------- GET /api/accounts/{id} ----------

	@Test
	void getsOneAccount() {
		JsonNode account = getOk("/api/accounts/" + SAVER_ACCOUNT);
		assertThat(account.get("name").asString()).isEqualTo("Rainy Day Saver");
		assertThat(account.get("sortCode").asString()).matches("\\d{2}-\\d{2}-\\d{2}");
	}

	@Test
	void anUnknownAccountIsA404ProblemDetail() {
		assertThat(mvc.get().uri("/api/accounts/7f000000-0000-4000-8000-000000000000"))
				.hasStatus(HttpStatus.NOT_FOUND)
				.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
				.bodyJson().extractingPath("$.status").isEqualTo(404);
	}

	@Test
	void theBanksInternalAccountsAreNotVisible() {
		// Same 404 as a missing id: the API never reveals that the internal account exists.
		assertThat(mvc.get().uri("/api/accounts/" + CARD_SETTLEMENT_ACCOUNT)).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(mvc.get().uri("/api/accounts/" + CARD_SETTLEMENT_ACCOUNT + "/transactions"))
				.hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void anIdThatIsNotAUuidIsA400() {
		assertThat(mvc.get().uri("/api/accounts/not-a-uuid"))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
	}

	// ---------- GET /api/accounts/{id}/transactions: paging ----------

	@Test
	void theFirstPageIsTheNewest20WithTotals() {
		JsonNode page = getOk(statement(EVERYDAY_ACCOUNT, ""));
		List<JsonNode> fixtures = Fixtures.transactionsOf(EVERYDAY_ACCOUNT);

		assertThat(page.get("page").asInt()).isZero();
		assertThat(page.get("size").asInt()).isEqualTo(20);
		assertThat(page.get("totalItems").asInt()).isEqualTo(EVERYDAY_ENTRIES);
		assertThat(page.get("totalPages").asInt()).isEqualTo((EVERYDAY_ENTRIES + 19) / 20);
		assertThat(page.get("items").size()).isEqualTo(20);

		// Same 20 transactions, same order, same running balances as the website's data.
		for (int i = 0; i < 20; i++) {
			JsonNode item = page.get("items").get(i);
			assertThat(item.get("id").asString()).isEqualTo(fixtures.get(i).get("id").asString());
			assertThat(item.get("balanceAfterPence").asLong()).isEqualTo(fixtures.get(i).get("balanceAfterPence").asLong());
		}
	}

	@Test
	void pagesDontOverlapAndTheLastPageHoldsTheRemainder() {
		Set<String> page0 = ids(getOk(statement(EVERYDAY_ACCOUNT, "&page=0")));
		Set<String> page1 = ids(getOk(statement(EVERYDAY_ACCOUNT, "&page=1")));
		assertThat(page0).doesNotContainAnyElementsOf(page1);

		int lastPage = (EVERYDAY_ENTRIES + 19) / 20 - 1;
		JsonNode last = getOk(statement(EVERYDAY_ACCOUNT, "&page=" + lastPage));
		assertThat(last.get("items").size()).isEqualTo(EVERYDAY_ENTRIES - lastPage * 20);
		// The oldest entry of all is the opening balance.
		JsonNode oldest = last.get("items").get(last.get("items").size() - 1);
		assertThat(oldest.get("kind").asString()).isEqualTo("opening_balance");

		JsonNode beyond = getOk(statement(EVERYDAY_ACCOUNT, "&page=" + (lastPage + 1)));
		assertThat(beyond.get("items").size()).isZero();
		assertThat(beyond.get("totalItems").asInt()).isEqualTo(EVERYDAY_ENTRIES);
	}

	@Test
	void everyEntryCanBeReadPageByPage() {
		Set<String> seen = new HashSet<>();
		for (int page = 0; page * 100 < EVERYDAY_ENTRIES; page++) {
			seen.addAll(ids(getOk(statement(EVERYDAY_ACCOUNT, "&size=100&page=" + page))));
		}
		assertThat(seen).hasSize(EVERYDAY_ENTRIES);
	}

	// ---------- Filters ----------

	@Test
	void filteringByCategoryKeepsTheRealRunningBalance() {
		JsonNode page = getOk(statement(EVERYDAY_ACCOUNT, "&category=Groceries&size=100"));
		List<JsonNode> groceries = Fixtures.transactionsOf(EVERYDAY_ACCOUNT).stream()
				.filter(t -> t.get("category").asString().equals("Groceries")).toList();
		Map<String, Long> balanceAfter = new HashMap<>();
		groceries.forEach(t -> balanceAfter.put(t.get("id").asString(), t.get("balanceAfterPence").asLong()));

		assertThat(page.get("totalItems").asInt()).isEqualTo(groceries.size());
		for (JsonNode item : page.get("items")) {
			assertThat(item.get("category").asString()).isEqualTo("Groceries");
			// The balance after each grocery payment is the account's real balance at that moment,
			// not a running total of groceries only.
			assertThat(item.get("balanceAfterPence").asLong()).isEqualTo(balanceAfter.get(item.get("id").asString()));
		}
	}

	@Test
	void filteringByDateUsesWholeUkDays() {
		LocalDate from = LocalDate.of(2026, 10, 1);
		LocalDate to = LocalDate.of(2026, 10, 31); // includes the day the clocks go back (25 Oct)
		Instant start = from.atStartOfDay(UK).toInstant();
		Instant end = to.plusDays(1).atStartOfDay(UK).toInstant();
		long expected = Fixtures.transactionsOf(EVERYDAY_ACCOUNT).stream()
				.map(t -> Instant.parse(t.get("date").asString()))
				.filter(d -> !d.isBefore(start) && d.isBefore(end))
				.count();

		JsonNode page = getOk(statement(EVERYDAY_ACCOUNT, "&from=2026-10-01&to=2026-10-31"));

		assertThat(expected).isPositive();
		assertThat(page.get("totalItems").asLong()).isEqualTo(expected);
	}

	@Test
	void searchIsCaseInsensitive() {
		long expected = Fixtures.transactionsOf(EVERYDAY_ACCOUNT).stream()
				.filter(t -> t.get("description").asString().toLowerCase().contains("coffee")).count();

		assertThat(getOk(statement(EVERYDAY_ACCOUNT, "&q=coffee")).get("totalItems").asLong()).isEqualTo(expected);
		assertThat(getOk(statement(EVERYDAY_ACCOUNT, "&q=COFFEE")).get("totalItems").asLong()).isEqualTo(expected);
	}

	@Test
	void searchTreatsWildcardCharactersAsText() {
		// Unescaped, "%" would match every row and "_" any single character.
		assertThat(getOk(statement(EVERYDAY_ACCOUNT, "&q=%25")).get("totalItems").asInt()).isZero(); // %25 = "%"
		assertThat(getOk(statement(EVERYDAY_ACCOUNT, "&q=_")).get("totalItems").asInt()).isZero();
	}

	@Test
	void filteringByKind() {
		JsonNode salaries = getOk(statement(EVERYDAY_ACCOUNT, "&kind=salary"));
		assertThat(salaries.get("totalItems").asInt()).isEqualTo(3);
		for (JsonNode item : salaries.get("items")) {
			assertThat(item.get("amountPence").asLong()).isPositive();
		}
	}

	@Test
	void transfersCarryTheSharedIdOfBothLegsAndOtherEntriesDont() {
		JsonNode roundUp = getOk(statement(ROUNDUP_ACCOUNT, "&size=1")).get("items").get(0);
		assertThat(roundUp.get("kind").asString()).isEqualTo("roundup");
		assertThat(roundUp.hasNonNull("transferId")).isTrue();

		JsonNode card = getOk(statement(EVERYDAY_ACCOUNT, "&kind=card&size=1")).get("items").get(0);
		assertThat(card.has("transferId")).isFalse(); // left out of the JSON, not "transferId": null
	}

	// ---------- Bad input is rejected, not guessed at ----------

	@Test
	void outOfRangeOrMalformedParametersAre400s() {
		List<String> bad = new ArrayList<>(List.of(
				"&size=0", "&size=101", "&page=-1", "&page=abc",
				"&kind=bogus", "&from=2026-13-01", "&from=2026-10-31&to=2026-10-01",
				"&q=" + "x".repeat(51)));
		for (String query : bad) {
			assertThat(mvc.get().uri(statement(EVERYDAY_ACCOUNT, query)))
					.as(query)
					.hasStatus(HttpStatus.BAD_REQUEST)
					.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
		}
	}

	@Test
	void aValidationErrorSaysWhichParameterIsWrongAndWhy() {
		assertThat(mvc.get().uri(statement(EVERYDAY_ACCOUNT, "&size=500")))
				.hasStatus(HttpStatus.BAD_REQUEST)
				.bodyJson().extractingPath("$.detail").asString()
				.isEqualTo("size: must be less than or equal to 100");
	}

	@Test
	void transactionsOfAnUnknownAccountAreA404() {
		assertThat(mvc.get().uri("/api/accounts/7f000000-0000-4000-8000-000000000000/transactions"))
				.hasStatus(HttpStatus.NOT_FOUND);
	}

	// ---------- helpers ----------

	private static String statement(String accountId, String query) {
		return "/api/accounts/" + accountId + "/transactions?" + query;
	}

	private JsonNode getOk(String uri) {
		MvcTestResult result = mvc.get().uri(uri).exchange();
		assertThat(result).as(uri).hasStatusOk();
		try {
			return json.readTree(result.getResponse().getContentAsString());
		} catch (java.io.UnsupportedEncodingException e) {
			throw new IllegalStateException(e);
		}
	}

	private static Set<String> ids(JsonNode page) {
		Set<String> ids = new HashSet<>();
		page.get("items").forEach(item -> ids.add(item.get("id").asString()));
		return ids;
	}
}
