package com.sterl.api.auth;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Slows down password guessing: after too many FAILED logins from one network address in a short
 * window, further attempts from it are refused (HTTP 429) until the window ends, even with the
 * right password.
 *
 * <p>Only failures count, so a customer logging in normally is never slowed down.
 * This guards against one address trying many passwords (or many accounts). Locking a single
 * ACCOUNT after repeated failures, wherever they come from, is the next layer (Auth sprint B).
 *
 * <p>Limits: counts live in this server's memory, so each server counts separately and a restart
 * resets them. A bank would keep them in a shared store (e.g. Redis). Behind a proxy, the client
 * address must come from the proxy's forwarded header (configured with the deployment, Day 24).
 */
@Component
public class LoginRateLimiter {

	private final int maxFailures;
	private final Duration window;
	private final Clock clock;
	private final Map<String, Window> failures = new ConcurrentHashMap<>();

	@Autowired // two constructors: this is the one Spring uses; the other lets tests pass a fake clock
	public LoginRateLimiter(@Value("${sterl.login.max-failures-per-window:10}") int maxFailures,
			@Value("${sterl.login.window:PT1M}") Duration window) {
		this(maxFailures, window, Clock.systemUTC());
	}

	LoginRateLimiter(int maxFailures, Duration window, Clock clock) {
		this.maxFailures = maxFailures;
		this.window = window;
		this.clock = clock;
	}

	private record Window(long startMillis, int count) {
	}

	/** Seconds the caller must wait before trying again, or 0 if it may try now. */
	public long secondsUntilAllowed(String clientIp) {
		Window current = failures.get(clientIp);
		long now = clock.millis();
		if (current == null || now - current.startMillis() >= window.toMillis() || current.count() < maxFailures) {
			return 0;
		}
		long remaining = window.toMillis() - (now - current.startMillis());
		return Math.max(1, (remaining + 999) / 1000); // round up: never say "0 seconds" while still blocked
	}

	public void recordFailure(String clientIp) {
		long now = clock.millis();
		// compute() is atomic per key: parallel failures from one address are all counted.
		failures.compute(clientIp, (ip, current) ->
				current == null || now - current.startMillis() >= window.toMillis()
						? new Window(now, 1)
						: new Window(current.startMillis(), current.count() + 1));
		if (failures.size() > 10_000) {
			// Don't let a flood of addresses grow this map without limit: drop expired windows.
			failures.values().removeIf(w -> now - w.startMillis() >= window.toMillis());
		}
	}
}
