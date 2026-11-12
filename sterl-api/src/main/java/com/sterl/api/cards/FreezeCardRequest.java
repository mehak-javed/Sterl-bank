package com.sterl.api.cards;

import jakarta.validation.constraints.NotNull;

/** PATCH /api/cards/{id}: freeze (true) or unfreeze (false). Boolean, not boolean: missing must be an error, not "false". */
public record FreezeCardRequest(@NotNull(message = "Say whether the card is frozen") Boolean frozen) {
}
