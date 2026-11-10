// Build error if a Client Component ever imports this file, so bank data code can't leak to the browser.
import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { latestSpendingMonth, summariseSpending, type MonthlySpending } from "@/lib/spending";
import type { Account, Transaction } from "@/types/bank";
import { findAccount, getRoundUpsEnabled, listAccounts, listTransactions } from "./bank-db";

/**
 * Data functions for SERVER COMPONENTS. They read bank-db directly: no fetch, no API route,
 * no JSON round trip. (Client Components still go through /api/... with TanStack Query.)
 *
 * connection(): with Cache Components on, Next would otherwise run this at BUILD time and bake
 * the balances into static HTML forever. Balances must be fresh, so: run on every request.
 *
 * A short delay keeps the demo honest about loading states. No random failures here: a
 * Server Component that throws replaces the whole page with error.tsx, which is too harsh for a demo.
 */
async function simulateServerLatency() {
  await connection();
  if (process.env.STERL_SIMULATE_NETWORK === "off") return;
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));
}

/**
 * React's cache(): within ONE request, calling getAccounts() twice (BalanceHero and
 * AccountsOverview both do) runs the work once and shares the result. It's forgotten
 * after the request, so the next visitor still gets fresh data.
 */
export const getAccounts = cache(async (): Promise<Account[]> => {
  await simulateServerLatency();
  return listAccounts();
});

export const getAccount = cache(async (id: string): Promise<Account | undefined> => {
  await simulateServerLatency();
  return findAccount(id);
});

export const getRoundUpSetting = cache(async (): Promise<boolean> => {
  await simulateServerLatency();
  return getRoundUpsEnabled();
});

export const getTransactions = cache(async (accountId: string, limit: number): Promise<Transaction[]> => {
  await simulateServerLatency();
  return listTransactions(accountId, limit);
});

/**
 * Spending by category for the latest month with activity, across the customer's current accounts
 * (savings pots don't have card spending). Summed on the server, so the browser only receives the
 * few totals it draws, not hundreds of transactions.
 */
export const getMonthlySpending = cache(async (): Promise<MonthlySpending | null> => {
  await simulateServerLatency();
  const spendingTransactions = listAccounts()
    .filter((a) => a.type === "current")
    .flatMap((a) => listTransactions(a.id, Number.MAX_SAFE_INTEGER));
  const month = latestSpendingMonth(spendingTransactions);
  return month === null ? null : summariseSpending(spendingTransactions, month);
});
