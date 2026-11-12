package com.sterl.api.cards;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * What a newly added card starts with: a starting balance and a few recent card payments, so every
 * card looks lived-in, and differently for every person and every card.
 *
 * <p>The numbers come from a Random SEEDED BY THE CARD'S ID: different for every card (ids are random
 * UUIDs), but the same every time for the same id, so tests can check exact results. Not a security
 * random: nothing secret depends on it.
 *
 * <p>All amounts are whole pence. Payments never add up to more than the starting balance, so a card
 * account never goes overdrawn. Shop names are invented (never real brands), as in the website's
 * fixture generator.
 */
public final class StarterActivity {

	public record Payment(String merchant, String category, long pence, Instant at) {
	}

	public record Plan(long startingPence, Instant startedAt, List<Payment> payments) {

		public long balancePence() {
			return startingPence - payments.stream().mapToLong(Payment::pence).sum();
		}
	}

	private record Shop(String name, String category, long minPence, long maxPence) {
	}

	private static final List<Shop> EVERYDAY = List.of(
			new Shop("Greenleaf Market", "Groceries", 150, 3_500),
			new Shop("Corner Fresh", "Groceries", 150, 2_500),
			new Shop("The Copper Kettle", "Eating out", 300, 1_800),
			new Shop("Bao House", "Eating out", 600, 2_200),
			new Shop("CityLine Travel", "Transport", 160, 1_200),
			new Shop("Starlight Cinema", "Entertainment", 500, 2_000));

	private static final List<Shop> TRAVEL = List.of(
			new Shop("Skyport Duty Free", "Shopping", 1_500, 9_000),
			new Shop("Harbourside Hotel", "Eating out", 2_500, 12_000),
			new Shop("CityLine Travel", "Transport", 300, 4_500),
			new Shop("Old Town Tapas", "Eating out", 1_200, 6_000),
			new Shop("Rail & Sail Tickets", "Transport", 900, 7_500));

	private static final List<Shop> ONLINE = List.of(
			new Shop("Thread & Co Online", "Shopping", 800, 6_000),
			new Shop("Bookends Online", "Shopping", 500, 3_000),
			new Shop("StreamFlix", "Subscriptions", 1_099, 1_099),
			new Shop("Volt Electronics Online", "Shopping", 1_500, 9_500),
			new Shop("Ticket Booth", "Entertainment", 900, 4_500));

	private static final List<Shop> PREMIER = List.of(
			new Shop("The Gilded Fork", "Eating out", 4_000, 18_000),
			new Shop("Homeware Hall", "Shopping", 3_000, 25_000),
			new Shop("Harbourside Hotel", "Eating out", 6_000, 30_000),
			new Shop("Arcade Bowl", "Entertainment", 1_500, 6_000),
			new Shop("Volt Electronics", "Shopping", 5_000, 40_000));

	private StarterActivity() {
	}

	/** @param now the moment the card is added; payments happen over the 30 days before it */
	public static Plan plan(UUID cardId, CardProduct product, Instant now) {
		Random random = new Random(cardId.getMostSignificantBits() ^ cardId.getLeastSignificantBits());
		long starting = switch (product) {
			case PREMIER -> between(random, 150_000, 800_000); // £1,500 to £8,000
			case TRAVEL -> between(random, 40_000, 250_000); // £400 to £2,500
			case DEBIT -> between(random, 20_000, 180_000); // £200 to £1,800
			case VIRTUAL -> between(random, 5_000, 60_000); // £50 to £600
		};
		List<Shop> shops = switch (product) {
			case PREMIER -> PREMIER;
			case TRAVEL -> TRAVEL;
			case DEBIT -> EVERYDAY;
			case VIRTUAL -> ONLINE;
		};

		Instant startedAt = now.minus(Duration.ofDays(31));
		int count = 3 + random.nextInt(4); // 3 to 6 payments
		long budget = starting * 6 / 10; // spend at most 60% of the starting balance
		List<Payment> payments = new ArrayList<>();
		for (int i = 0; i < count; i++) {
			Shop shop = shops.get(random.nextInt(shops.size()));
			long pence = Math.min(between(random, shop.minPence(), shop.maxPence()), budget);
			if (pence <= 0) {
				break;
			}
			budget -= pence;
			// Spread over the last 30 days, oldest first, at a random minute of the day.
			Instant at = startedAt.plus(Duration.ofDays(1 + (long) i * 29 / count)).plus(Duration.ofMinutes(between(random, 7 * 60, 22 * 60)));
			payments.add(new Payment(shop.name(), shop.category(), pence, at.isAfter(now) ? now : at));
		}
		return new Plan(starting, startedAt, List.copyOf(payments));
	}

	private static long between(Random random, long min, long max) {
		return min + random.nextLong(max - min + 1);
	}
}
