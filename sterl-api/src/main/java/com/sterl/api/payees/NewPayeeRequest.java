package com.sterl.api.payees;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** POST /api/payees. The same checks the database enforces, with messages a person can act on. */
public record NewPayeeRequest(
		@NotBlank(message = "Enter the name on their account") @Size(max = 40, message = "Use 40 characters or fewer")
		@Pattern(regexp = "\\s*[A-Za-z][A-Za-z .'&-]*", message = "Use letters, spaces and . ' & - only") String name,
		@NotNull(message = "Choose person or business") @Pattern(regexp = "person|business", message = "Choose person or business") String type,
		@NotNull(message = "Enter a sort code like 12-34-56") @Pattern(regexp = "\\d{2}-\\d{2}-\\d{2}", message = "Enter a sort code like 12-34-56") String sortCode,
		@NotNull(message = "Enter an 8-digit account number") @Pattern(regexp = "\\d{8}", message = "Enter an 8-digit account number") String accountNumber) {
}
