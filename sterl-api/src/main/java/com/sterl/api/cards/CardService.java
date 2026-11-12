package com.sterl.api.cards;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.auth.SignupService;
import com.sterl.api.common.CurrentCustomer;

/** The logged-in customer's cards: list, add, freeze and unfreeze. */
@Service
public class CardService {

	/** Cards last 3 years, like most UK debit cards. */
	static final int CARD_LIFETIME_YEARS = 3;

	/** Longest name an embossed card line holds. */
	static final int MAX_NAME_ON_CARD = 26;

	/** The card's own account is named after the card (the same names as the website's lib/cards.ts). */
	static final Map<CardProduct, String> PRODUCT_NAMES = Map.of(
			CardProduct.DEBIT, "Everyday Debit", CardProduct.PREMIER, "Premier Metal",
			CardProduct.TRAVEL, "Travel Card", CardProduct.VIRTUAL, "Virtual Card");

	private final SecureRandom random = new SecureRandom();
	private final CardRepository cards;
	private final CurrentCustomer currentCustomer;
	private final Clock clock;

	public CardService(CardRepository cards, CurrentCustomer currentCustomer, Clock clock) {
		this.cards = cards;
		this.currentCustomer = currentCustomer;
		this.clock = clock;
	}

	public List<CardResponse> listCards() {
		return cards.findCustomerCards(currentCustomer.id());
	}

	/** 404 for a card that doesn't exist AND for someone else's card: we never confirm it exists. */
	public CardResponse getCard(UUID cardId) {
		return cards.findCustomerCard(currentCustomer.id(), cardId).orElseThrow(CardService::notFound);
	}

	/**
	 * Adds a card. Each new card gets its OWN account (e.g. "Travel Card"), opened with a starting
	 * balance and a few recent payments (StarterActivity), so the card shows its own money and
	 * history. Everything (account, ledger, card, audit) is one database transaction: all or nothing.
	 * 409 if the customer already has that card.
	 */
	@Transactional
	public CardResponse issue(CardProduct product) {
		UUID customerId = currentCustomer.id();
		if (!cards.lockCustomer(customerId)) {
			throw notFound();
		}
		if (cards.customerHasProduct(customerId, product)) {
			throw alreadyHave();
		}

		UUID cardId = UUID.randomUUID();
		UUID accountId = UUID.randomUUID();
		Instant now = clock.instant();
		YearMonth expiry = YearMonth.now(clock).plusYears(CARD_LIFETIME_YEARS);

		cards.insertCardAccount(accountId, customerId, PRODUCT_NAMES.get(product), SignupService.STERL_SORT_CODE,
				String.format("%08d", random.nextInt(100_000_000)));
		cards.insertStarterActivity(accountId, StarterActivity.plan(cardId, product, now));
		cards.insert(cardId, accountId, product, new CardDetails(nameOnCard(cards.nameOf(customerId)),
				product.testLast4(), expiry.getMonthValue(), expiry.getYear()));
		cards.audit(customerId, "card.issued", cardId, product.code());
		return getCard(cardId);
	}

	/**
	 * Freeze or unfreeze. Asking for the state the card is already in changes nothing and writes no
	 * audit record (so a double tap is harmless), but still answers 200 with the card.
	 */
	@Transactional
	public CardResponse setFrozen(UUID cardId, boolean frozen) {
		UUID customerId = currentCustomer.id();
		CardResponse card = cards.lockCustomerCard(customerId, cardId).orElseThrow(CardService::notFound);
		if (card.frozen() == frozen) {
			return card;
		}
		cards.setFrozen(cardId, frozen);
		cards.audit(customerId, frozen ? "card.frozen" : "card.unfrozen", cardId, card.product());
		return getCard(cardId);
	}

	/** "Alex Example" -> "ALEX EXAMPLE", cut to what fits on the card ("|" can't be embossed or stored). */
	static String nameOnCard(String fullName) {
		String upper = fullName.replace('|', ' ').strip().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
		return upper.length() <= MAX_NAME_ON_CARD ? upper : upper.substring(0, MAX_NAME_ON_CARD).strip();
	}

	private static ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found");
	}

	private static ResponseStatusException alreadyHave() {
		return new ResponseStatusException(HttpStatus.CONFLICT, "You already have this card.");
	}
}
