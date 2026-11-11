import accountsJson from "@/mocks/data/accounts.json";
import cardsJson from "@/mocks/data/cards.json";
import transactionsJson from "@/mocks/data/transactions.json";
import { assertPence, type Pence } from "@/lib/money";
import type { Account, Card, Transaction } from "@/types/bank";

/**
 * Sterl's "database": an in-memory copy of the seeded JSON fixtures.
 * Only server code should import this file.
 *
 * Changes (like freezing the card) live in memory, so they reset when the server restarts,
 * and on Vercel each server instance has its own copy. That's fine for a demo, and it's
 * exactly the gap the PostgreSQL ledger fills in the backend phase.
 *
 * The `as` casts: TypeScript reads JSON strings as plain `string`, not our union types
 * like "current" | "saver". We trust these files because our own generator wrote them.
 */
type BankState = {
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  /** Server state: the bank decides whether to round up future card spends, so it lives here, not in the browser. */
  roundUpsEnabled: boolean;
};

/**
 * ONE shared copy, kept on globalThis. Next bundles API routes and Server Components/actions
 * separately, and each bundle would otherwise get its OWN copy of this module's variables:
 * a transfer made by a server action would be invisible to /api/accounts. globalThis is
 * shared by every bundle in the same Node process, and also survives dev hot reloads.
 * (The same trick is used for database clients like Prisma in Next apps.)
 */
/**
 * Bump this whenever the SHAPE of the fixture data changes (a new field, say). A running dev server
 * keeps its globalThis copy across hot reloads, so without this it would go on serving the old
 * shape: adding `product` to cards crashed the Cards page until the server was restarted.
 * Version 2: cards gained `product` and the wallet has four cards.
 */
const BANK_DATA_VERSION = 2;

const globalForBank = globalThis as typeof globalThis & { __sterlBank?: BankState & { version: number } };
if (globalForBank.__sterlBank?.version !== BANK_DATA_VERSION) {
  globalForBank.__sterlBank = {
    version: BANK_DATA_VERSION,
    accounts: structuredClone(accountsJson) as Account[],
    transactions: structuredClone(transactionsJson) as Transaction[],
    cards: structuredClone(cardsJson) as Card[],
    roundUpsEnabled: true,
  };
}
const db = globalForBank.__sterlBank;
const { accounts, transactions, cards } = db; // same arrays, mutated in place, never reassigned

export function listAccounts(): Account[] {
  return accounts;
}

export function findAccount(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

/** Newest first, already sorted by the generator. */
export function listTransactions(accountId: string, limit: number): Transaction[] {
  return transactions.filter((t) => t.accountId === accountId).slice(0, limit);
}

export function listCards(): Card[] {
  return cards;
}

export function setCardFrozen(id: string, frozen: boolean): Card | undefined {
  const card = cards.find((c) => c.id === id);
  if (card) card.frozen = frozen;
  return card;
}

// ---------- Round-ups setting ----------

export function getRoundUpsEnabled(): boolean {
  return db.roundUpsEnabled;
}

export function setRoundUpsEnabled(enabled: boolean): void {
  db.roundUpsEnabled = enabled;
}

// ---------- Transfers between the customer's own accounts ----------

export type TransferResult =
  | { ok: true; transferId: string; from: Account; to: Account }
  | { ok: false; reason: "same_account" | "unknown_account" | "insufficient_funds" };

/**
 * Double-entry: one transfer = two transactions (legs) sharing a transferId.
 * Money out of one account (-amount), the same money into the other (+amount): the legs sum to 0,
 * so money is moved, never created or lost.
 *
 * All checks happen BEFORE anything changes, and the function never awaits, so no other request
 * can run halfway through: both legs are written or neither is. (In PostgreSQL this would be one
 * database transaction with the from-account row locked.)
 */
export function transferBetweenAccounts(
  fromId: string,
  toId: string,
  amountPence: Pence,
  reference: string,
): TransferResult {
  assertPence(amountPence);
  if (amountPence <= 0) throw new RangeError("Transfer amount must be positive");
  if (fromId === toId) return { ok: false, reason: "same_account" };

  const from = findAccount(fromId);
  const to = findAccount(toId);
  if (!from || !to) return { ok: false, reason: "unknown_account" };
  if (from.balancePence < amountPence) return { ok: false, reason: "insufficient_funds" };

  const transferId = crypto.randomUUID();
  const date = new Date().toISOString();
  const description = reference || `Transfer: ${from.name} to ${to.name}`;

  from.balancePence -= amountPence;
  to.balancePence += amountPence;

  const legs: Transaction[] = [
    { id: crypto.randomUUID(), accountId: from.id, date, description, category: "Savings", kind: "transfer", amountPence: -amountPence, balanceAfterPence: from.balancePence, transferId },
    { id: crypto.randomUUID(), accountId: to.id, date, description, category: "Savings", kind: "transfer", amountPence, balanceAfterPence: to.balancePence, transferId },
  ];
  transactions.unshift(...legs); // newest first, like the rest of the list

  return { ok: true, transferId, from, to };
}
