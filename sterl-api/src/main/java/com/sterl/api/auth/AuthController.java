package com.sterl.api.auth;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Logging in and out. The session lives in PostgreSQL; the browser only holds an HttpOnly cookie
 * with a random session id, which page scripts can't read (so an XSS bug can't steal it).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	/** One message for "no such email" AND "wrong password": never reveal which emails have accounts. */
	static final String BAD_CREDENTIALS = "Email or password is incorrect.";

	private final AuthenticationManager authentication;
	private final SecurityContextRepository contexts;
	private final UserRepository users;
	private final LoginRateLimiter rateLimiter;
	private final CookieCsrfTokenRepository csrfCookies = CookieCsrfTokenRepository.withHttpOnlyFalse();

	public AuthController(AuthenticationManager authentication, SecurityContextRepository contexts,
			UserRepository users, LoginRateLimiter rateLimiter) {
		this.authentication = authentication;
		this.contexts = contexts;
		this.users = users;
		this.rateLimiter = rateLimiter;
	}

	/**
	 * @param password up to 128 characters: Argon2 is deliberately slow and memory-hungry, so an
	 *                 enormous "password" must never reach it (that would be a cheap denial-of-service)
	 */
	public record LoginRequest(@NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 128) String password) {
	}

	public record Me(UUID userId, UUID customerId, String email, String role, String firstName, String lastName) {
	}

	/**
	 * GET /api/auth/csrf: sets the XSRF-TOKEN cookie. The front end copies that cookie's value into
	 * an X-XSRF-TOKEN header on every POST/PUT/PATCH/DELETE. (Reading the token is what makes Spring
	 * write the cookie; the body only says which header and cookie to use.)
	 */
	@GetMapping("/csrf")
	public Map<String, String> csrf(CsrfToken token) {
		token.getToken();
		return Map.of("cookieName", "XSRF-TOKEN", "headerName", token.getHeaderName());
	}

	/** POST /api/auth/login: needs a CSRF token too, so another site can't log you in as someone else. */
	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequest login, HttpServletRequest request,
			HttpServletResponse response) {
		String clientIp = request.getRemoteAddr();
		long waitSeconds = rateLimiter.secondsUntilAllowed(clientIp);
		if (waitSeconds > 0) {
			ProblemDetail tooMany = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS,
					"Too many failed login attempts. Try again in " + waitSeconds + " seconds.");
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
					.header(HttpHeaders.RETRY_AFTER, String.valueOf(waitSeconds)).body(tooMany);
		}

		String email = login.email().strip();
		Authentication result;
		try {
			result = authentication.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(email, login.password()));
		} catch (AuthenticationException failed) {
			rateLimiter.recordFailure(clientIp);
			users.auditLogin("anonymous", "auth.login.failed", email, clientIp);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS));
		}

		// Session fixation defence: if a session already exists (one an attacker might have planted),
		// give it a brand-new id now, so the id from before login is worthless afterwards.
		if (request.getSession(false) != null) {
			request.changeSessionId();
		}
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(result);
		SecurityContextHolder.setContext(context);
		contexts.saveContext(context, request, response);

		// A new CSRF token after login: the browser fetches a fresh one from /api/auth/csrf.
		csrfCookies.saveToken(null, request, response);

		SterlUser user = (SterlUser) result.getPrincipal();
		users.recordLogin(user.id());
		users.auditLogin("user:" + user.id(), "auth.login.succeeded", user.email(), clientIp);
		return ResponseEntity.ok(me(user));
	}

	/** GET /api/auth/me: who is logged in (401 if nobody). */
	@GetMapping("/me")
	public Me whoAmI(@AuthenticationPrincipal SterlUser user) {
		return me(user);
	}

	/** POST /api/auth/logout: ends the session on the server, not just in the browser. */
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@AuthenticationPrincipal SterlUser user, HttpServletRequest request,
			HttpServletResponse response) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate(); // deletes the row in spring_session: the cookie is now useless
		}
		SecurityContextHolder.clearContext();
		csrfCookies.saveToken(null, request, response);
		users.auditLogin("user:" + user.id(), "auth.logout", user.email(), request.getRemoteAddr());
		return ResponseEntity.noContent().build();
	}

	private Me me(SterlUser user) {
		Map<String, Object> name = user.customerId() == null ? Map.of()
				: users.customerName(user.customerId()).orElse(Map.of());
		return new Me(user.id(), user.customerId(), user.email(), user.role(),
				(String) name.get("first_name"), (String) name.get("last_name"));
	}
}
