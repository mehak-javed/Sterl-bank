import accountsJson from "@/mocks/data/accounts.json";
import cardsJson from "@/mocks/data/cards.json";
import transactionsJson from "@/mocks/data/transactions.json";
import type { Account, Card, Transaction } from "@/types/bank";

/**
 * Sterl's "database": an in-memory copy of the seeded JSON fixtures.
 * Only server code (route handlers) should import this file.
 *
 * Changes (like freezing the card) live in memory, so they reset when the server restarts,
 * and on Vercel each server instance has its own copy. That's fine for a demo, and it's
 * exactly the gap the PostgreSQL ledger fills in the backend phase.
 *
 * The `as` casts: TypeScript reads JSON strings as plain `string`, not our union types
 * like "current" | "saver". We trust these files because our own generator wrote them.
 */
const accounts = structuredClone(accountsJson) as Account[];
const transactions = structuredClone(transactionsJson) as Transaction[];
const cards = structuredClone(cardsJson) as Card[];

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
