package com.sterl.api.accounts;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.common.CurrentCustomer;
import com.sterl.api.common.PageResponse;

/**
 * The rules around reading accounts: what "a day" means, what counts as not found,
 * how a page is put together. The controller handles HTTP; the repository handles SQL.
 */
@Service
public class AccountService {

	/**
	 * A UK bank's "day" is a UK day. 1 July runs from 00:00 to 24:00 London time (BST, UTC+1),
	 * not UTC, so a 23:30 card payment on 30 June in London isn't counted as 1 July.
	 */
	static final ZoneId UK = ZoneId.of("Europe/London");

	private final AccountRepository accounts;
	private final CurrentCustomer currentCustomer;

	public AccountService(AccountRepository accounts, CurrentCustomer currentCustomer) {
		this.accounts = accounts;
		this.currentCustomer = currentCustomer;
	}

	public List<AccountResponse> listAccounts() {
		return accounts.findCustomerAccounts(currentCustomer.id());
	}

	public AccountResponse getAccount(UUID id) {
		// The same 404 for "doesn't exist", "is internal" and "isn't yours", so the API never reveals
		// which ids exist.
		return accounts.findCustomerAccount(currentCustomer.id(), id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account with id " + id + "."));
	}

	/**
	 * @param fromDate first day to include (UK time), or null for no lower limit
	 * @param toDate   last day to include (UK time), or null for no upper limit
	 * @param search   text to find in the description; blank means no search
	 */
	public PageResponse<TransactionResponse> getStatement(UUID accountId, String category, String kind,
			LocalDate fromDate, LocalDate toDate, String search, int page, int size) {
		getAccount(accountId); // 404 before anything else

		if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'from' must be on or before 'to'.");
		}

		// Inclusive dates become a half-open range [from 00:00, day after "to" 00:00), in UK time.
		Instant from = fromDate == null ? null : fromDate.atStartOfDay(UK).toInstant();
		Instant before = toDate == null ? null : toDate.plusDays(1).atStartOfDay(UK).toInstant();
		String text = search == null || search.isBlank() ? null : search.strip();

		TransactionFilter filter = new TransactionFilter(category, kind, from, before, text);
		long total = accounts.countStatement(accountId, filter);
		long offset = (long) page * size; // long: page * size could overflow an int
		List<TransactionResponse> items = total == 0 ? List.of()
				: accounts.findStatementPage(accountId, filter, size, offset);
		return PageResponse.of(items, page, size, total);
	}
}
