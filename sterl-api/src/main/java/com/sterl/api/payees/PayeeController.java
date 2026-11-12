package com.sterl.api.payees;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.common.CurrentCustomer;

import jakarta.validation.Valid;

/**
 * The logged-in customer's saved payees (customers only, see SecurityConfig). Small enough to keep the SQL
 * here. A new payee is "new" for 24 hours, which the payment screening rules take into account.
 * (The payee name check, "does that name match the account?", is issue #16.)
 */
@RestController
@RequestMapping("/api/payees")
public class PayeeController {

	private final JdbcClient jdbc;
	private final CurrentCustomer currentCustomer;

	public PayeeController(JdbcClient jdbc, CurrentCustomer currentCustomer) {
		this.jdbc = jdbc;
		this.currentCustomer = currentCustomer;
	}

	@GetMapping
	public List<PayeeResponse> list() {
		return jdbc.sql("""
				SELECT id, name, type, sort_code, right(account_number, 4), created_at
				  FROM payees WHERE customer_id = :customerId ORDER BY name
				""").param("customerId", currentCustomer.id())
				.query((rs, i) -> new PayeeResponse(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3), rs.getString(4),
						rs.getString(5), rs.getObject(6, OffsetDateTime.class).toInstant()))
				.list();
	}

	/** 201 with the payee; 409 if this customer already saved that sort code and account number. */
	@PostMapping
	@Transactional
	public ResponseEntity<PayeeResponse> add(@Valid @RequestBody NewPayeeRequest request) {
		UUID customerId = currentCustomer.id();
		UUID id = UUID.randomUUID();
		String name = request.name().strip().replaceAll("\\s+", " ");
		try {
			jdbc.sql("""
					INSERT INTO payees (id, customer_id, name, type, sort_code, account_number)
					VALUES (:id, :customerId, :name, :type, :sortCode, :accountNumber)
					""").param("id", id).param("customerId", customerId).param("name", name).param("type", request.type())
					.param("sortCode", request.sortCode()).param("accountNumber", request.accountNumber()).update();
		}
		catch (DuplicateKeyException duplicate) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "You've already saved this account as a payee.");
		}
		jdbc.sql("""
				INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
				VALUES (:actor, 'payee.added', 'payee', :id, '{}'::jsonb)
				""").param("actor", "customer:" + customerId).param("id", id.toString()).update();
		PayeeResponse created = new PayeeResponse(id, name, request.type(), request.sortCode(),
				request.accountNumber().substring(4), java.time.Instant.now());
		return ResponseEntity.created(URI.create("/api/payees/" + id)).body(created);
	}
}
