package com.sterl.api.common;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Who is making this request. Every query that touches customer data asks this class, and
 * NEVER takes a customer id from the request (a caller could put anyone's id there).
 *
 * <p>For now it's the single demo customer from the seed. In Auth sprint A this becomes the
 * logged-in user from Spring Security, and nothing that calls {@link #id()} has to change.
 */
@Component
public class CurrentCustomer {

	private final UUID id;

	public CurrentCustomer(@Value("${sterl.demo-customer-id}") UUID id) {
		this.id = id;
	}

	public UUID id() {
		return id;
	}
}
