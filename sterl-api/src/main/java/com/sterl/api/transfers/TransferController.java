package com.sterl.api.transfers;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

/**
 * Transfers between the customer's own accounts.
 *
 * <p>Every POST needs an {@code Idempotency-Key} header: a unique value the client makes for each
 * transfer it intends (a UUID is ideal) and sends again, unchanged, on every retry of that transfer.
 * The network can drop a response after the money has moved; with the key, retrying is always safe.
 */
@RestController
@RequestMapping("/api/transfers")
public class TransferController {

	private final TransferService service;

	public TransferController(TransferService service) {
		this.service = service;
	}

	/**
	 * POST /api/transfers. 201 Created the first time; 200 OK with {@code Idempotent-Replayed: true}
	 * and the original result when the same key and request are sent again.
	 */
	@PostMapping
	public ResponseEntity<TransferResponse> createTransfer(
			@RequestHeader("Idempotency-Key") @Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String idempotencyKey,
			@Valid @RequestBody TransferRequest request) {
		TransferService.Result result = service.transfer(idempotencyKey, request);
		TransferResponse transfer = result.transfer();
		if (result.replayed()) {
			return ResponseEntity.ok().header("Idempotent-Replayed", "true").body(transfer);
		}
		return ResponseEntity.created(URI.create("/api/transfers/" + transfer.id())).body(transfer);
	}

	/** GET /api/transfers/{id}: where the 201's Location header points. */
	@GetMapping("/{id}")
	public TransferResponse getTransfer(@PathVariable UUID id) {
		return service.getTransfer(id);
	}
}
