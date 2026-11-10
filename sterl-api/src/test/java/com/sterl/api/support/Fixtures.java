package com.sterl.api.support;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The front end's JSON fixtures (src/mocks/data), the same fake bank the database is seeded from.
 * Tests compare the API against these, so the API and the website can never drift apart.
 */
public final class Fixtures {

	public static final String EVERYDAY_ACCOUNT = "f9312322-42e1-486f-916f-dd42ae894c25";
	public static final String SAVER_ACCOUNT = "5c4ac976-5edf-41bf-921b-9d2c322da85e";
	public static final String ROUNDUP_ACCOUNT = "fa52c98e-c243-4b09-ace5-d1d26c23bbab";
	public static final String CARD_SETTLEMENT_ACCOUNT = "00000000-0000-4000-8000-000000000002";

	private static final Path DATA = Path.of("..", "src", "mocks", "data");
	private static final JsonMapper JSON = JsonMapper.builder().build();

	private Fixtures() {
	}

	public static JsonNode read(String file) {
		return JSON.readTree(DATA.resolve(file).toFile());
	}

	/** The fixture transactions of one account, newest first (the order the generator wrote them). */
	public static List<JsonNode> transactionsOf(String accountId) {
		List<JsonNode> result = new ArrayList<>();
		for (JsonNode t : read("transactions.json")) {
			if (t.get("accountId").asString().equals(accountId)) {
				result.add(t);
			}
		}
		return result;
	}
}
