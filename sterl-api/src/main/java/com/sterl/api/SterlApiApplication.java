package com.sterl.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Sterl API: the Java back end that will own all money movement
 * (double-entry ledger), the audit log and the credit risk calculations.
 *
 * <p>{@code @SpringBootApplication} turns on component scanning for this package and below,
 * so every {@code @RestController}, {@code @Service} and {@code @Repository} under
 * {@code com.sterl.api} is found and wired automatically.
 *
 * <p>Portfolio demo: not a real bank, all data is fake.
 */
@SpringBootApplication
public class SterlApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SterlApiApplication.class, args);
	}

}
