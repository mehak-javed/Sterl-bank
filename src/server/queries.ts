// Build error if a Client Component ever imports this file, so bank data code can't leak to the browser.
import "server-only";

import { cache } from "react";
import { latestSpendingMonth, summariseSpending, ukMonthOf, type MonthlySpending } from "@/lib/spending";
import type { Account, Transaction } from "@/types/bank";
import { apiGet } from "./sterl-api";

/**
 * Data functions for SERVER COMPONENTS: the logged-in customer's own data, from the Java API and
 * PostgreSQL (see sterl-api.ts). A new customer simply gets an empty list or £0.00, never an error.
 */

/** The shape of a page from the Java API (com.sterl.api.common.PageResponse). */
type Page<T> = { items: T[]; page: number; size: number; totalItems: number; totalPages: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PAGE_SIZE = 100; // the API's limit

/**
 * React's cache(): within ONE request, calling getAccounts() twice (BalanceHero and
 * AccountsOverview both do) asks the API once and shares the result. Forgotten after the request.
 */
export const getAccounts = cache(async (): Promise<Account[]> => (await apiGet<Account[]>("/api/accounts")) ?? []);

/** undefined for an id that isn't one of the customer's accounts (the page shows "not found"). */
export const getAccount = cache(async (id: string): Promise<Account | undefined> =>
  UUID.test(id) ? apiGet<Account>(`/api/accounts/${id}`) : undefined,
);

export const getTransactions = cache(async (accountId: string, limit: number): Promise<Transaction[]> => {
  if (!UUID.test(accountId)) return [];
  const size = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  const page = await apiGet<Page<Transaction>>(`/api/accounts/${accountId}/transactions?size=${size}`);
  return page?.items ?? [];
});

/**
 * Newest-first pages of one account's statement, only as far back as the latest month with
 * spending: usually one or two requests, however long the history is.
 */
async function latestMonthsTransactions(accountId: string): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let page = 0; page < 20; page++) {
    const result = await apiGet<Page<Transaction>>(`/api/accounts/${accountId}/transactions?size=${MAX_PAGE_SIZE}&page=${page}`);
    if (!result || result.items.length === 0) break;
    all.push(...result.items);
    const month = latestSpendingMonth(all);
    const oldest = result.items[result.items.length - 1];
    if (page + 1 >= result.totalPages || (month !== null && ukMonthOf(oldest.date) < month)) break;
  }
  return all;
}

/**
 * Spending by category for the latest month with activity, across the customer's current accounts
 * (savings pots don't have card spending). Summed on the server, so the browser only receives the
 * few totals it draws. null for a customer who hasn't spent anything yet.
 */
export const getMonthlySpending = cache(async (): Promise<MonthlySpending | null> => {
  const current = (await getAccounts()).filter((a) => a.type === "current");
  const spending = (await Promise.all(current.map((a) => latestMonthsTransactions(a.id)))).flat();
  const month = latestSpendingMonth(spending);
  return month === null ? null : summariseSpending(spending, month);
});
