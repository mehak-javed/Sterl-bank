package com.sterl.api.payments;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A risk officer's release or rejection. The reason is required: it goes in the audit trail. */
public record ReviewRequest(@NotBlank(message = "Give a reason") @Size(max = 500) String note) {
}
