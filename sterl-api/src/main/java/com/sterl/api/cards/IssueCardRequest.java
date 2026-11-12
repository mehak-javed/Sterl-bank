package com.sterl.api.cards;

import jakarta.validation.constraints.NotNull;

/**
 * POST /api/cards: which card to add. Nothing else: the account, the name on the card and the
 * expiry are decided by the server, so a caller can't put a card on someone else's account.
 */
public record IssueCardRequest(@NotNull(message = "Choose a card") CardProduct product) {
}
