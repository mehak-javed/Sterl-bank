package com.sterl.api.accounts;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** POST /api/accounts/{id}/top-ups: how much to add, in pence. Long, not double: money is never a float. */
public record AddMoneyRequest(
		@NotNull(message = "Enter an amount") @Positive(message = "Enter an amount more than £0.00")
		@Max(value = AddMoneyService.MAX_PENCE, message = "You can add up to £10,000.00 at a time") Long amountPence) {
}
