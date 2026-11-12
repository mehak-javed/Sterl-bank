package com.sterl.api.common;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "Now" as a bean, in UK time. Code asks for a Clock instead of calling now() directly, so a test can
 * swap in a fixed clock and check date logic (like card expiry dates) exactly.
 */
@Configuration(proxyBeanMethods = false)
public class ClockConfig {

	@Bean
	Clock clock() {
		return Clock.system(ZoneId.of("Europe/London"));
	}
}
