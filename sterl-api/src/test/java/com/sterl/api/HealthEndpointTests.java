package com.sterl.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.sterl.api.support.LoggedIn;
import com.sterl.api.support.SterlIntegrationTest;

/**
 * The health endpoint is how AWS and monitoring decide whether the API is alive,
 * so its behaviour is part of the contract and gets tested like any other feature.
 *
 * <p>MockMvc sends real HTTP requests through the full Spring stack (routing, JSON,
 * security later) without opening a network port, so the tests are fast and reliable.
 */
@SterlIntegrationTest
@AutoConfigureMockMvc
class HealthEndpointTests {

	@Autowired
	private MockMvcTester mvc;

	@Test
	void healthIsUp() {
		assertThat(mvc.get().uri("/actuator/health"))
				.hasStatusOk()
				.bodyJson().extractingPath("$.status").isEqualTo("UP");
	}

	@Test
	void livenessAndReadinessProbesAreUp() {
		assertThat(mvc.get().uri("/actuator/health/liveness"))
				.hasStatusOk()
				.bodyJson().extractingPath("$.status").isEqualTo("UP");
		assertThat(mvc.get().uri("/actuator/health/readiness"))
				.hasStatusOk()
				.bodyJson().extractingPath("$.status").isEqualTo("UP");
	}

	@Test
	void healthDoesNotRevealInternalDetails() {
		assertThat(mvc.get().uri("/actuator/health"))
				.bodyJson().doesNotHavePath("$.components");
	}

	@Test
	void sensitiveActuatorEndpointsAreNotExposed() {
		// env would show configuration (and any secrets in it); beans shows the app's internals.
		// Two layers: anonymous callers are stopped by login (401), and even a logged-in customer
		// finds nothing there (404), because the endpoints aren't exposed at all.
		LoggedIn customer = LoggedIn.asDemoCustomer(mvc);
		for (String endpoint : new String[] {"/actuator/env", "/actuator/beans", "/actuator/heapdump"}) {
			assertThat(mvc.get().uri(endpoint)).as(endpoint).hasStatus(HttpStatus.UNAUTHORIZED);
			assertThat(customer.get(endpoint)).as(endpoint).hasStatus(HttpStatus.NOT_FOUND);
		}
	}

	@Test
	void infoCarriesTheDemoDisclaimer() {
		assertThat(mvc.get().uri("/actuator/info"))
				.hasStatusOk()
				.bodyJson().extractingPath("$.app.disclaimer")
				.isEqualTo("Sterl is a portfolio demo. Not a real bank. All data is fake.");
	}
}
