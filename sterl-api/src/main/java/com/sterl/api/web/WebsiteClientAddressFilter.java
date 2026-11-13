package com.sterl.api.web;

import java.io.IOException;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Tells the API the VISITOR's network address when the request was forwarded by our own website.
 *
 * <p>Why: in production the browser talks to the website (Vercel), and the website forwards /api/* calls
 * here. Without this, every request would appear to come from the website's servers, so the per-address
 * login limit would count all visitors together (one attacker could lock everyone out) and the audit log
 * would record the website's address instead of the visitor's.
 *
 * <p>How it stays safe: anyone on the internet can send a header claiming any address. So the claimed
 * address ({@code X-Sterl-Client-IP}) is believed ONLY when the request also carries the shared secret
 * ({@code X-Sterl-Proxy-Secret}) that only the website and the API know (environment variable
 * STERL_PROXY_SECRET on both, never in git). The secret is compared in constant time, and the address must
 * be a plain IP literal (never a host name, so no DNS lookup can be triggered). Otherwise the header is
 * ignored and the normal address is used. With no secret configured (local development, tests), it does
 * nothing at all.
 *
 * <p>It runs first, before Spring Security, so the rate limiter and audit log both see the visitor.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class WebsiteClientAddressFilter extends OncePerRequestFilter {

	static final String SECRET_HEADER = "X-Sterl-Proxy-Secret";
	static final String CLIENT_IP_HEADER = "X-Sterl-Client-IP";

	private final byte[] secret;

	public WebsiteClientAddressFilter(@Value("${sterl.proxy.shared-secret:}") String secret) {
		this.secret = secret.isBlank() ? null : secret.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String visitor = trustedVisitorAddress(request);
		chain.doFilter(visitor == null ? request : new VisitorRequest(request, visitor), response);
	}

	private String trustedVisitorAddress(HttpServletRequest request) {
		if (secret == null) {
			return null;
		}
		String presented = request.getHeader(SECRET_HEADER);
		if (presented == null
				|| !MessageDigest.isEqual(secret, presented.getBytes(StandardCharsets.UTF_8))) {
			return null;
		}
		return ipLiteralOrNull(request.getHeader(CLIENT_IP_HEADER));
	}

	/** The address in normal form if it is an IPv4/IPv6 literal, else null. Never resolves names. */
	static String ipLiteralOrNull(String value) {
		if (value == null || value.isBlank() || value.length() > 45) {
			return null;
		}
		try {
			return InetAddress.ofLiteral(value.strip()).getHostAddress(); // Java 22+: literals only, no DNS
		}
		catch (IllegalArgumentException notAnAddress) {
			return null;
		}
	}

	private static final class VisitorRequest extends HttpServletRequestWrapper {

		private final String address;

		VisitorRequest(HttpServletRequest request, String address) {
			super(request);
			this.address = address;
		}

		@Override
		public String getRemoteAddr() {
			return address;
		}

		@Override
		public String getRemoteHost() {
			return address;
		}
	}
}
