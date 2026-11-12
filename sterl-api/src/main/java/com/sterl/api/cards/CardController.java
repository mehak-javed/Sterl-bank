package com.sterl.api.cards;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** The logged-in customer's cards. Customers only (SecurityConfig); every change needs the CSRF token. */
@RestController
@RequestMapping("/api/cards")
public class CardController {

	private final CardService service;

	public CardController(CardService service) {
		this.service = service;
	}

	/** GET /api/cards: an empty list for a new customer, never an error. */
	@GetMapping
	public List<CardResponse> listCards() {
		return service.listCards();
	}

	@GetMapping("/{id}")
	public CardResponse getCard(@PathVariable UUID id) {
		return service.getCard(id);
	}

	/** POST /api/cards {"product":"virtual"}: 201 Created with the new card. */
	@PostMapping
	public ResponseEntity<CardResponse> issueCard(@Valid @RequestBody IssueCardRequest request) {
		CardResponse card = service.issue(request.product());
		return ResponseEntity.created(URI.create("/api/cards/" + card.id())).body(card);
	}

	/** PATCH /api/cards/{id} {"frozen":true}: freeze or unfreeze. */
	@PatchMapping("/{id}")
	public CardResponse setFrozen(@PathVariable UUID id, @Valid @RequestBody FreezeCardRequest request) {
		return service.setFrozen(id, request.frozen());
	}
}
