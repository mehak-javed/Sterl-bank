package com.sterl.api.payments;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.sterl.api.payments.ScreeningResult.Decision;

/** The decision rules on their own: every threshold tested on both sides of the line. */
class PaymentScreeningRulesTests {

	/** A settled customer: 10 payments averaging £40 this month, an old payee, nothing recent. */
	private static ScreeningFacts usual(long amountPence) {
		return new ScreeningFacts(amountPence, 4_000, 10, 0, 24 * 90, "person");
	}

	@Test
	void anEverydayPaymentGoesStraightThrough() {
		ScreeningResult result = PaymentScreeningRules.screen(usual(2_500));
		assertThat(result.decision()).isEqualTo(Decision.APPROVE);
		assertThat(result.riskScore()).isZero();
		assertThat(result.hits()).isEmpty();
	}

	@Test
	void exactlyThreeTimesTheUsualAmountIsFineAPennyMoreIsHeld() {
		assertThat(PaymentScreeningRules.screen(usual(12_000)).hits()).isEmpty();
		ScreeningResult over = PaymentScreeningRules.screen(usual(12_001));
		assertThat(over.hits()).containsExactly(ScreeningRule.LARGE_FOR_THIS_CUSTOMER);
		assertThat(over.decision()).isEqualTo(Decision.HOLD); // 55 points >= 50
	}

	@Test
	void withLittleHistoryOnlyOverAThousandPoundsCountsAsLarge() {
		ScreeningFacts newCustomer = new ScreeningFacts(100_000, 0, 0, 0, 24 * 30, "person");
		assertThat(PaymentScreeningRules.screen(newCustomer).hits()).isEmpty(); // exactly £1,000
		ScreeningFacts justOver = new ScreeningFacts(100_001, 0, 2, 0, 24 * 30, "person");
		assertThat(PaymentScreeningRules.screen(justOver).hits()).containsExactly(ScreeningRule.LARGE_FOR_THIS_CUSTOMER);
	}

	@Test
	void fiveThousandPoundsOrMoreIsAlwaysHeld() {
		ScreeningFacts rich = new ScreeningFacts(500_000, 400_000, 20, 0, 24 * 365, "business");
		ScreeningResult result = PaymentScreeningRules.screen(rich);
		assertThat(result.hits()).containsExactly(ScreeningRule.HIGH_VALUE);
		assertThat(result.decision()).isEqualTo(Decision.HOLD);
		assertThat(PaymentScreeningRules.screen(new ScreeningFacts(499_999, 400_000, 20, 0, 24 * 365, "business")).hits()).isEmpty();
	}

	@Test
	void theThirdPaymentWithinTenMinutesIsHeld() {
		assertThat(PaymentScreeningRules.screen(new ScreeningFacts(2_500, 4_000, 10, 1, 24 * 90, "person")).hits()).isEmpty();
		ScreeningResult third = PaymentScreeningRules.screen(new ScreeningFacts(2_500, 4_000, 10, 2, 24 * 90, "person"));
		assertThat(third.hits()).containsExactly(ScreeningRule.RAPID_REPEAT);
		assertThat(third.decision()).isEqualTo(Decision.HOLD);
	}

	@Test
	void aNewPayeeAloneRaisesTheScoreButDoesNotHold() {
		ScreeningResult result = PaymentScreeningRules.screen(new ScreeningFacts(2_500, 4_000, 10, 0, 23, "person"));
		assertThat(result.hits()).containsExactly(ScreeningRule.NEW_PAYEE);
		assertThat(result.riskScore()).isEqualTo(30);
		assertThat(result.decision()).isEqualTo(Decision.APPROVE);
		assertThat(PaymentScreeningRules.screen(new ScreeningFacts(2_500, 4_000, 10, 0, 24, "person")).hits()).isEmpty();
	}

	@Test
	void theScoreAddsUpButNeverPasses100() {
		ScreeningResult everything = PaymentScreeningRules.screen(new ScreeningFacts(900_000, 4_000, 10, 5, 1, "person"));
		assertThat(everything.hits()).containsExactly(ScreeningRule.HIGH_VALUE, ScreeningRule.LARGE_FOR_THIS_CUSTOMER,
				ScreeningRule.RAPID_REPEAT, ScreeningRule.NEW_PAYEE);
		assertThat(everything.riskScore()).isEqualTo(100);
	}
}
