package com.sterl.api.common;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.sterl.api.auth.SterlUser;

/**
 * Who is making this request: the customer behind the logged-in user's session.
 *
 * <p>Every query that touches customer data asks this class, and NEVER takes a customer id from the
 * request: a caller could put anyone's id there (the most common API security bug, OWASP API1
 * "broken object level authorisation"). Since Auth sprint A this comes from Spring Security instead
 * of a fixed demo id; nothing that calls {@link #id()} had to change.
 */
@Component
public class CurrentCustomer {

	public UUID id() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.getPrincipal() instanceof SterlUser user && user.customerId() != null) {
			return user.customerId();
		}
		// Unreachable through the API (SecurityConfig requires the CUSTOMER role first), but fail safe:
		// no customer, no data.
		throw new AccessDeniedException("No customer is logged in");
	}
}
