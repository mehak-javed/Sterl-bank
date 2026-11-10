package com.sterl.api.auth;

import java.io.Serial;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * The logged-in user, as Spring Security holds it for the rest of the session.
 *
 * <p>Serializable: Spring Session stores the session in PostgreSQL as bytes.
 * CredentialsContainer: after a successful login Spring Security calls {@link #eraseCredentials()},
 * so the password hash is NOT kept in the session (a leaked session row reveals no hash).
 */
public final class SterlUser implements UserDetails, CredentialsContainer {

	@Serial
	private static final long serialVersionUID = 1L;

	private final UUID id;
	private final UUID customerId; // null for staff (Week 3)
	private final String email;
	private final String role;
	private final boolean enabled;
	private String passwordHash;

	public SterlUser(UUID id, UUID customerId, String email, String passwordHash, String role, boolean enabled) {
		this.id = id;
		this.customerId = customerId;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
		this.enabled = enabled;
	}

	public UUID id() {
		return id;
	}

	public UUID customerId() {
		return customerId;
	}

	public String email() {
		return email;
	}

	public String role() {
		return role;
	}

	/** "customer" → ROLE_CUSTOMER, which is what hasRole("CUSTOMER") checks. */
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}

	@Override
	public void eraseCredentials() {
		passwordHash = null;
	}
}
