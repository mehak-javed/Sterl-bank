package com.sterl.api.transfers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sterl.api.common.CurrentCustomer;
import com.sterl.api.common.Pounds;

/**
 * Moves money between the customer's own accounts, exactly once.
 *
 * <p>The whole method is ONE database transaction: claim the idempotency key, lock both accounts,
 * check the balance, write both ledger legs and the audit entry. If anything fails, all of it is
 * rolled back: no half transfer, no orphaned key, no missing audit record.
 */
@Service
public class TransferService {

	/** 422: the request is well-formed but can't be carried out (no money, reused key). */
	static final HttpStatusCode UNPROCESSABLE = HttpStatusCode.valueOf(422);

	private final TransferRepository transfers;
	private final CurrentCustomer currentCustomer;

	public TransferService(TransferRepository transfers, CurrentCustomer currentCustomer) {
		this.transfers = transfers;
		this.currentCustomer = currentCustomer;
	}

	/** @param replayed true when this key was already used for this exact request */
	public record Result(TransferResponse transfer, boolean replayed) {
	}

	@Transactional
	public Result transfer(String idempotencyKey, TransferRequest request) {
		UUID customerId = currentCustomer.id();
		UUID from = request.fromAccountId();
		UUID to = request.toAccountId();
		if (from.equals(to)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose two different accounts.");
		}

		// 1. Claim the key, or replay the earlier result.
		UUID ledgerTransactionId = UUID.randomUUID();
		String fingerprint = request.fingerprint();
		if (!transfers.claimIdempotencyKey(customerId, idempotencyKey, fingerprint, ledgerTransactionId)) {
			TransferRepository.IdempotencyRecord earlier = transfers.findIdempotencyRecord(customerId, idempotencyKey)
					.orElseThrow(() -> new IllegalStateException("Idempotency key vanished: " + idempotencyKey));
			if (!earlier.requestHash().equals(fingerprint)) {
				throw new ResponseStatusException(UNPROCESSABLE,
						"This Idempotency-Key was already used for a different transfer. Use a new key for a new transfer.");
			}
			return new Result(load(customerId, earlier.ledgerTransactionId()), true);
		}

		// 2. Lock both accounts (in id order), then check them.
		List<TransferRepository.LockedAccount> locked = transfers.lockOwnAccounts(customerId, from, to);
		TransferRepository.LockedAccount fromAccount = find(locked, from);
		TransferRepository.LockedAccount toAccount = find(locked, to);

		// 3. Check the balance only now, while no other transfer can change it.
		long balance = transfers.balanceOf(from);
		long amount = request.amountPence();
		if (balance < amount) {
			throw new ResponseStatusException(UNPROCESSABLE, "There isn't enough money in " + fromAccount.name()
					+ ": the balance is " + Pounds.format(balance) + " and the transfer is " + Pounds.format(amount) + ".");
		}

		// 4. Double entry + audit, in the same database transaction.
		String description = request.cleanReference() != null ? request.cleanReference()
				: "Transfer to " + toAccount.name();
		transfers.insertTransfer(ledgerTransactionId, from, to, amount, description);
		transfers.audit(customerId, ledgerTransactionId, from, to, amount, idempotencyKey);
		return new Result(load(customerId, ledgerTransactionId), false);
	}

	@Transactional(readOnly = true)
	public TransferResponse getTransfer(UUID id) {
		return transfers.findTransfer(currentCustomer.id(), id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No transfer with id " + id + "."));
	}

	private TransferResponse load(UUID customerId, UUID ledgerTransactionId) {
		return transfers.findTransfer(customerId, ledgerTransactionId)
				.orElseThrow(() -> new IllegalStateException("Transfer not found after writing it: " + ledgerTransactionId));
	}

	/** Same 404 for "doesn't exist", "isn't yours" and "internal": never reveal which ids exist. */
	private static TransferRepository.LockedAccount find(List<TransferRepository.LockedAccount> locked, UUID id) {
		return locked.stream().filter(a -> a.id().equals(id)).findFirst()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account with id " + id + "."));
	}
}
