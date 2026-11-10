package com.sterl.api.accounts;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sterl.api.common.PageResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Read-only account endpoints.
 *
 * <p>Every query parameter is checked here with Bean Validation before any code runs: anything
 * out of range gets a 400 "problem details" response (RFC 9457) explaining what's wrong.
 * A path id that isn't a UUID is a 400 too, before it gets near the database.
 */
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

	private static final String KINDS = "opening_balance|card|direct_debit|standing_order|salary|transfer|roundup";

	private final AccountService service;

	public AccountController(AccountService service) {
		this.service = service;
	}

	/** GET /api/accounts: the customer's accounts with their current balances. */
	@GetMapping
	public List<AccountResponse> listAccounts() {
		return service.listAccounts();
	}

	/** GET /api/accounts/{id}: one account, or 404. */
	@GetMapping("/{id}")
	public AccountResponse getAccount(@PathVariable UUID id) {
		return service.getAccount(id);
	}

	/**
	 * GET /api/accounts/{id}/transactions: the statement, newest first, one page at a time.
	 * Example: {@code ?category=Groceries&from=2026-10-01&to=2026-10-31&page=0&size=20}
	 */
	@GetMapping("/{id}/transactions")
	public PageResponse<TransactionResponse> getTransactions(
			@PathVariable UUID id,
			@RequestParam(required = false) @Size(max = 40) String category,
			@RequestParam(required = false) @Pattern(regexp = KINDS) String kind,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) @Size(max = 50) String q,
			// Limits stop one request asking for a million rows (or an enormous OFFSET).
			@RequestParam(defaultValue = "0") @Min(0) @Max(10_000) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return service.getStatement(id, category, kind, from, to, q, page, size);
	}
}
