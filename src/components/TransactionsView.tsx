"use client";

import { useAccounts, useActiveAccountId, useTransactions } from "@/lib/api/queries";
import { useUiStore } from "@/stores/UiStoreProvider";
import { QueryError, SkeletonRows } from "./QueryStates";
import { TransactionTable } from "./TransactionTable";

/**
 * Stays a Client Component: the account <select> is browser state, and the table must
 * re-fetch the moment you change it, without a page load.
 */
export function TransactionsView() {
  const { data: accounts } = useAccounts();
  const activeId = useActiveAccountId();
  const selectAccount = useUiStore((s) => s.selectAccount); // same choice as the dashboard (Zustand)
  const { data: transactions, isPending, isError, error, refetch } = useTransactions(activeId, 100);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium sm:w-72">
        Account
        <select
          value={activeId ?? ""}
          onChange={(e) => selectAccount(e.target.value)}
          disabled={!accounts}
          className="rounded-lg border border-line bg-surface px-3 py-2"
        >
          {!accounts && <option value="">Loading…</option>}
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <section aria-labelledby="statement-heading" aria-busy={isPending} className="glass rounded-2xl p-4">
        <h2 id="statement-heading" className="mb-3 text-lg font-semibold text-heading">
          Transactions
        </h2>
        {isPending ? (
          <SkeletonRows rows={8} />
        ) : isError ? (
          <QueryError message={`We couldn't load your transactions. ${error.message}`} onRetry={() => refetch()} />
        ) : (
          <TransactionTable transactions={transactions} />
        )}
      </section>
    </>
  );
}
