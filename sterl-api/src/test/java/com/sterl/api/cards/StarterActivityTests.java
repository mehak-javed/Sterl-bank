package com.sterl.api.cards;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

/** The starting balance and payments a new card gets: the rules, with no database. */
class StarterActivityTests {

	private static final Instant NOW = Instant.parse("2026-11-12T12:00:00Z");
	private static final UUID CARD_A = UUID.fromString("11111111-2222-4333-8444-555555555555");
	private static final UUID CARD_B = UUID.fromString("99999999-8888-4777-8666-555555555555");

	@Test
	void theSameCardAlwaysGetsTheSameStartSoTestsCanCheckIt() {
		assertThat(StarterActivity.plan(CARD_A, CardProduct.DEBIT, NOW)).isEqualTo(StarterActivity.plan(CARD_A, CardProduct.DEBIT, NOW));
	}

	@Test
	void differentCardsGetDifferentMoneyAndPayments() {
		StarterActivity.Plan a = StarterActivity.plan(CARD_A, CardProduct.DEBIT, NOW);
		StarterActivity.Plan b = StarterActivity.plan(CARD_B, CardProduct.DEBIT, NOW);
		assertThat(a.startingPence()).isNotEqualTo(b.startingPence());
		assertThat(a.payments()).isNotEqualTo(b.payments());
	}

	@Test
	void premierCardsStartWithMoreThanVirtualCards() {
		for (int i = 0; i < 200; i++) {
			UUID id = UUID.randomUUID();
			assertThat(StarterActivity.plan(id, CardProduct.PREMIER, NOW).startingPence()).isBetween(150_000L, 800_000L);
			assertThat(StarterActivity.plan(id, CardProduct.VIRTUAL, NOW).startingPence()).isBetween(5_000L, 60_000L);
		}
	}

	/** A property check over many random cards, not just one example. */
	@Test
	void noCardEverStartsOverdrawnAndEveryPaymentIsInThePastInOrder() {
		for (int i = 0; i < 1_000; i++) {
			for (CardProduct product : CardProduct.values()) {
				StarterActivity.Plan plan = StarterActivity.plan(UUID.randomUUID(), product, NOW);
				assertThat(plan.payments()).hasSizeBetween(1, 6);
				assertThat(plan.balancePence()).isGreaterThanOrEqualTo(plan.startingPence() * 4 / 10); // spent at most 60%
				Instant previous = plan.startedAt();
				for (StarterActivity.Payment payment : plan.payments()) {
					assertThat(payment.pence()).isPositive();
					assertThat(payment.at()).isAfter(previous).isBeforeOrEqualTo(NOW);
					previous = payment.at();
				}
			}
		}
	}
}
