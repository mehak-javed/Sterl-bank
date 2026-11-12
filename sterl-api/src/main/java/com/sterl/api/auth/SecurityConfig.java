package com.sterl.api.auth;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * Who may call what, and the protections around every request.
 *
 * <p>Deny by default: anything not listed as public needs a logged-in user, and banking endpoints need
 * the CUSTOMER role. A new endpoint is therefore private unless someone deliberately makes it public.
 */
@Configuration
public class SecurityConfig {

	/** The algorithm new passwords are hashed with. Stored hashes carry this id as a prefix. */
	static final String PASSWORD_ENCODER_ID = "argon2@SpringSecurity_v5_8";

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository contexts, JsonMapper json)
			throws Exception {
		http
				.authorizeHttpRequests(rules -> rules
						// Public: health checks, the CSRF token, logging in, and Spring's error page.
						.requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/signup").permitAll()
						.requestMatchers("/error").permitAll()
						// Banking: customers only. (Staff areas get their own roles in Week 3.)
						.requestMatchers("/api/accounts/**", "/api/transfers/**", "/api/cards/**").hasRole("CUSTOMER")
						// Everything else: logged in, at least.
						.anyRequest().authenticated())

				// CSRF: a malicious site could make the browser send our session cookie along with a forged
				// request. So every state-changing request (POST, PUT, PATCH, DELETE) must also carry a token
				// that only our own pages can read: the XSRF-TOKEN cookie, copied into an X-XSRF-TOKEN header.
				// spa() = the standard setup for a JavaScript front end.
				.csrf(csrf -> csrf.spa())

				// Sessions: the logged-in user is kept in the (PostgreSQL-backed) session.
				.securityContext(context -> context.securityContextRepository(contexts))

				// No browser login pop-ups or HTML login pages: this is a JSON API with its own login endpoint.
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)

				// Security headers on every response. Spring already adds: no MIME sniffing, no framing
				// (clickjacking), no caching of responses, and HSTS over HTTPS.
				.headers(headers -> headers
						// The API only ever returns JSON: a browser must never run scripts or load anything from it.
						.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
						.referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER)))

				// Errors as RFC 9457 problem details, like the rest of the API.
				.exceptionHandling(errors -> errors
						.authenticationEntryPoint((request, response, ex) -> writeProblem(response, json,
								HttpStatus.UNAUTHORIZED, "Please log in."))
						.accessDeniedHandler((request, response, ex) -> writeProblem(response, json,
								HttpStatus.FORBIDDEN, "You don't have access to this, or the request is missing its CSRF token.")));
		return http.build();
	}

	/**
	 * The session cookie, set explicitly. Left to defaults, Spring Session copies these settings from
	 * the web server's configuration, which a test environment doesn't have: tests found the cookie
	 * there WITHOUT HttpOnly, Secure and SameSite. Declared here, the same cookie is used (and tested)
	 * everywhere.
	 * <ul>
	 *   <li>HttpOnly: page scripts can't read it, so an XSS bug can't steal the session;</li>
	 *   <li>Secure: only ever sent over HTTPS;</li>
	 *   <li>SameSite=Lax: not sent with other sites' form posts (a second CSRF defence).</li>
	 * </ul>
	 */
	@Bean
	CookieSerializer cookieSerializer(@Value("${sterl.session-cookie.secure:true}") boolean secure) {
		DefaultCookieSerializer cookie = new DefaultCookieSerializer();
		cookie.setCookieName("SESSION");
		cookie.setCookiePath("/");
		cookie.setUseHttpOnlyCookie(true);
		cookie.setUseSecureCookie(secure);
		cookie.setSameSite("Lax");
		return cookie;
	}

	/** Where the logged-in user lives between requests: the HTTP session (stored by Spring Session JDBC). */
	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	/**
	 * Argon2id for new passwords; the "{id}" prefix on each stored hash says how it was made, so the
	 * algorithm can be upgraded later without breaking existing logins.
	 */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new DelegatingPasswordEncoder(PASSWORD_ENCODER_ID,
				Map.of(PASSWORD_ENCODER_ID, Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()));
	}

	@Bean
	UserDetailsService userDetailsService(UserRepository users) {
		return email -> users.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("No such user")); // never shown to the caller
	}

	/**
	 * Checks an email + password. For an unknown email it still runs a full password hash, so the
	 * response takes the same time as a wrong password: timing can't reveal which emails have accounts.
	 */
	@Bean
	AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder encoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
		provider.setPasswordEncoder(encoder);
		return new ProviderManager(provider);
	}

	private static void writeProblem(HttpServletResponse response, JsonMapper json, HttpStatus status, String detail)
			throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
		json.writeValue(response.getOutputStream(), ProblemDetail.forStatusAndDetail(status, detail));
	}
}
