package com.sterl.api.support;

import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Tests start from an empty sterl_test database: Flyway drops everything ("clean"), then runs
 * every migration from V1. So the tests prove the migrations work from scratch, exactly as they
 * will on a brand-new server, and leftovers from an earlier run can never make a test pass.
 *
 * Only possible in tests: clean is disabled everywhere else (see application-test.properties).
 */
@TestConfiguration(proxyBeanMethods = false)
public class FreshDatabase {

	@Bean
	FlywayMigrationStrategy cleanThenMigrate() {
		return flyway -> {
			flyway.clean();
			flyway.migrate();
		};
	}
}
