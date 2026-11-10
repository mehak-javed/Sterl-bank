package com.sterl.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

/**
 * The rate limiter on its own, with a fake clock: no Spring, no database, and no waiting a real
 * minute for the window to pass.
 */
class LoginRateLimiterTests {

	/** A clock the test moves forward by hand. */
	private static final class TestClock extends Clock {
		private Instant now = Instant.parse("2026-11-10T09:00:00Z");

		void advance(Duration duration) {
			now = now.plus(duration);
		}

		@Override
		public Instant instant() {
			return now;
		}

		@Override
		public ZoneId getZone() {
			return ZoneId.of("UTC");
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}
	}

	private final TestClock clock = new TestClock();
	private final LoginRateLimiter limiter = new LoginRateLimiter(3, Duration.ofMinutes(1), clock);

	@Test
	void allowsAttemptsUntilTheLimitIsReached() {
		limiter.recordFailure("203.0.113.1");
		limiter.recordFailure("203.0.113.1");
		assertThat(limiter.secondsUntilAllowed("203.0.113.1")).isZero();

		limiter.recordFailure("203.0.113.1");
		assertThat(limiter.secondsUntilAllowed("203.0.113.1")).isEqualTo(60);
	}

	@Test
	void tellsHowLongToWaitAndLetsAttemptsBackInAfterTheWindow() {
		for (int i = 0; i < 3; i++) {
			limiter.recordFailure("203.0.113.2");
		}
		clock.advance(Duration.ofSeconds(45));
		assertThat(limiter.secondsUntilAllowed("203.0.113.2")).isEqualTo(15);

		clock.advance(Duration.ofSeconds(15));
		assertThat(limiter.secondsUntilAllowed("203.0.113.2")).isZero();
	}

	@Test
	void neverSaysZeroSecondsWhileStillBlocked() {
		for (int i = 0; i < 3; i++) {
			limiter.recordFailure("203.0.113.3");
		}
		clock.advance(Duration.ofMillis(59_500)); // half a second left
		assertThat(limiter.secondsUntilAllowed("203.0.113.3")).isEqualTo(1);
	}

	@Test
	void eachAddressIsCountedSeparately() {
		for (int i = 0; i < 3; i++) {
			limiter.recordFailure("203.0.113.4");
		}
		assertThat(limiter.secondsUntilAllowed("203.0.113.4")).isPositive();
		assertThat(limiter.secondsUntilAllowed("203.0.113.5")).isZero();
	}

	@Test
	void anUnknownAddressIsAllowed() {
		assertThat(limiter.secondsUntilAllowed("198.51.100.200")).isZero();
	}
}
