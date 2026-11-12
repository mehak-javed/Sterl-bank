package com.sterl.api.payments;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

/** Customers paying their saved payees. Customers only (SecurityConfig); every POST needs the CSRF token. */
@RestController
@RequestMapping("/api/payments")
@Validated
public class PaymentController {

	private final PaymentService service;
	private final ExplanationService explanations;

	public PaymentController(PaymentService service, ExplanationService explanations) {
		this.service = service;
		this.explanations = explanations;
	}

	/**
	 * POST /api/payments with an Idempotency-Key. 201 settled (money sent) or 202 held (accepted, not sent:
	 * waiting for a security check). A repeat of the same request returns the original answer with 200.
	 */
	@PostMapping
	public ResponseEntity<PaymentResponse> pay(
			@RequestHeader("Idempotency-Key") @Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String idempotencyKey,
			@Valid @RequestBody PaymentRequest request) {
		PaymentService.Decided decided = service.pay(request, idempotencyKey);
		PaymentRepository.PaymentRow payment = decided.payment();
		if (decided.replayed()) {
			return ResponseEntity.ok().header("Idempotent-Replayed", "true")
					.body(PaymentResponse.of(payment, explanations.recorded(payment.id(), payment)));
		}
		// The decision is committed; only now is the explanation written (AI or template).
		Explanation explanation = explanations.explainAndRecord(payment.id(), decided.facts(), decided.result());
		PaymentResponse body = PaymentResponse.of(payment, explanation);
		URI location = URI.create("/api/payments/" + payment.id());
		return "settled".equals(payment.status()) ? ResponseEntity.created(location).body(body)
				: ResponseEntity.accepted().location(location).body(body);
	}

	/** GET /api/payments: the latest 20, newest first, each with its customer message. */
	@GetMapping
	public java.util.List<PaymentResponse> recent() {
		return service.recent().stream().map(p -> PaymentResponse.of(p, explanations.recorded(p.id(), p))).toList();
	}

	@GetMapping("/{id}")
	public PaymentResponse get(@PathVariable UUID id) {
		PaymentRepository.PaymentRow payment = service.get(id);
		return PaymentResponse.of(payment, explanations.recorded(id, payment));
	}
}
