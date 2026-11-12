package com.sterl.api.payments;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sterl.api.auth.SterlUser;

import jakarta.validation.Valid;

/**
 * The risk officers' queue of held payments (under /api/risk: staff only). A person makes the final call:
 * release (the money moves) or reject (it never does), always with a reason for the audit trail.
 */
@RestController
@RequestMapping("/api/risk/payments")
public class HeldPaymentsController {

	private final PaymentService service;
	private final PaymentRepository payments;

	public HeldPaymentsController(PaymentService service, PaymentRepository payments) {
		this.service = service;
		this.payments = payments;
	}

	@GetMapping("/held")
	public List<HeldPaymentResponse> held() {
		return payments.listHeld().stream().map(this::toHeld).toList();
	}

	@PostMapping("/{id}/release")
	public HeldPaymentResponse release(@PathVariable UUID id, @Valid @RequestBody ReviewRequest review,
			@AuthenticationPrincipal SterlUser staff) {
		service.release(id, staff.email(), review.note().strip());
		return toHeld(payments.findForStaff(id).orElseThrow());
	}

	@PostMapping("/{id}/reject")
	public HeldPaymentResponse reject(@PathVariable UUID id, @Valid @RequestBody ReviewRequest review,
			@AuthenticationPrincipal SterlUser staff) {
		service.reject(id, staff.email(), review.note().strip());
		return toHeld(payments.findForStaff(id).orElseThrow());
	}

	private HeldPaymentResponse toHeld(PaymentRepository.PaymentRow p) {
		return new HeldPaymentResponse(p.id(), p.status(), p.amountPence(), p.riskScore(), p.ruleHits(),
				payments.latestExplanation(p.id()).map(Explanation::reviewerNote).orElse(""), p.createdAt());
	}
}
