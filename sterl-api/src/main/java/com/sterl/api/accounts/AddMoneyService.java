package com.sterl.api.accounts;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.common.CurrentCustomer;
import com.sterl.api.transfers.TransferRepository;

/**
 * "Add money": money arriving in one of the customer's accounts from outside Sterl. In a real bank
 * this is a payment from another bank; here the customer chooses the amount, which is how a new
 * customer gets money into an empty account.
 *
 * <p>Double entry like everything else: the bank's INBOUND_PAYMENTS account goes down by the amount
 * and the customer's account goes up by it, so the ledger still sums to zero.
 * Exactly once, like transfers: the same Idempotency-Key never adds money twice (a double tap, or a
 * retry after a dropped connection). Keys share the transfers' table, scoped to the customer.
 */
@Service
public class AddMoneyService {

	public static final long MAX_PENCE = 1_000_000; // £10,000 per top-up

	private static final HttpStatusCode UNPROCESSABLE = HttpStatusCode.valueOf(422);

	private final AccountRepository accounts;
	private final TransferRepository idempotency;
	private final CurrentCustomer currentCustomer;

	public AddMoneyService(AccountRepository accounts, TransferRepository idempotency, CurrentCustomer currentCustomer) {
		this.accounts = accounts;
		this.idempotency = idempotency;
		this.currentCustomer = currentCustomer;
	}

	public record Result(TransactionResponse transaction, boolean replayed) {
	}

	@Transactional
	public Result addMoney(UUID accountId, String idempotencyKey, long amountPence) {
		UUID customerId = currentCustomer.id();
		UUID ledgerTransactionId = UUID.randomUUID();
		String fingerprint = fingerprint(accountId, amountPence);

		if (!idempotency.claimIdempotencyKey(customerId, idempotencyKey, fingerprint, ledgerTransactionId)) {
			TransferRepository.IdempotencyRecord earlier = idempotency.findIdempotencyRecord(customerId, idempotencyKey)
					.orElseThrow(() -> new IllegalStateException("Idempotency key vanished: " + idempotencyKey));
			if (!earlier.requestHash().equals(fingerprint)) {
				throw new ResponseStatusException(UNPROCESSABLE,
						"This Idempotency-Key was already used for a different request. Use a new key.");
			}
			return new Result(load(earlier.ledgerTransactionId(), accountId), true);
		}

		// Only the customer's own account: anyone else's (or an internal one) is a plain 404.
		if (!accounts.lockOwnAccount(customerId, accountId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found");
		}
		accounts.insertMoneyAdded(ledgerTransactionId, accountId, amountPence);
		accounts.auditMoneyAdded(customerId, ledgerTransactionId, accountId, amountPence, idempotencyKey);
		return new Result(load(ledgerTransactionId, accountId), false);
	}

	private TransactionResponse load(UUID ledgerTransactionId, UUID accountId) {
		return accounts.findEntry(ledgerTransactionId, accountId)
				.orElseThrow(() -> new IllegalStateException("Top-up not found after writing it: " + ledgerTransactionId));
	}

	/** "add-money|" keeps these hashes apart from transfer hashes, which share the table. */
	private static String fingerprint(UUID accountId, long amountPence) {
		try {
			byte[] hash = MessageDigest.getInstance("SHA-256")
					.digest(("add-money|" + accountId + "|" + amountPence).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		}
		catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 is always available on the JVM", e);
		}
	}
}
