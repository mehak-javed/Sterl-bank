import { assertPence, type Pence } from "@/lib/money";
import type { Transaction } from "@/types/bank";

/**
 * "Where did my money go this month?", by category.
 *
 * Counts money LEAVING the bank: card payments, direct debits and standing orders. Leaves out
 * transfers between the customer's own accounts and round-ups (that money is still theirs), and
 * refunds (money coming back).
 *
 * Months are UK months: a card payment at 23:30 on 30 September UTC is 00:30 on 1 October in London
 * (BST), so it counts as October, the month the customer sees on their statement.
 */

const SPENDING_KINDS = new Set<Transaction["kind"]>(["card", "direct_debit", "standing_order"]);

const ukYearMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit" });

/** "2026-10" for any moment in October 2026, UK time. */
export function ukMonthOf(isoDate: string): string {
  const parts = ukYearMonth.formatToParts(new Date(isoDate));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

/** The most recent UK month that has any transaction, or null if there are none. */
export function latestMonth(transactions: readonly Transaction[]): string | null {
  let latest: string | null = null;
  for (const t of transactions) {
    const month = ukMonthOf(t.date);
    if (latest === null || month > latest) latest = month; // "YYYY-MM" strings sort correctly as text
  }
  return latest;
}

/** Is this transaction money spent (rather than moved between own accounts, refunded or received)? */
export function isSpending(t: Transaction): boolean {
  return SPENDING_KINDS.has(t.kind) && t.amountPence < 0;
}

/**
 * The most recent UK month in which the customer SPENT anything. Not just "the latest month with any
 * transaction": a transfer to savings on 5 November shouldn't make the summary show an empty November.
 */
export function latestSpendingMonth(transactions: readonly Transaction[]): string | null {
  return latestMonth(transactions.filter(isSpending));
}

export type CategorySpend = {
  category: Transaction["category"];
  pence: Pence;
  /** This category's part of the month's total, 0 to 1. For drawing a bar only, never for money. */
  share: number;
};

export type MonthlySpending = { month: string; totalPence: Pence; categories: CategorySpend[] };

export function summariseSpending(transactions: readonly Transaction[], month: string): MonthlySpending {
  const byCategory = new Map<Transaction["category"], Pence>();
  for (const t of transactions) {
    if (!isSpending(t) || ukMonthOf(t.date) !== month) continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) - t.amountPence); // spending as a positive amount
  }

  let totalPence = 0;
  for (const pence of byCategory.values()) totalPence += pence;
  assertPence(totalPence);

  const categories = [...byCategory.entries()]
    .map(([category, pence]) => ({ category, pence, share: totalPence === 0 ? 0 : pence / totalPence }))
    .sort((a, b) => b.pence - a.pence || a.category.localeCompare(b.category));

  return { month, totalPence, categories };
}

/** "2026-10" → "October 2026". */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, m - 1, 1)),
  );
}
