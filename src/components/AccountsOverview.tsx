"use client";

import { formatGBP } from "@/lib/money";
import { useAccounts, useActiveAccountId } from "@/lib/api/queries";
import { useUiStore } from "@/stores/UiStoreProvider";
import { QueryError, SkeletonRows } from "./QueryStates";

export function AccountsOverview() {
  const { data: accounts, isPending, isError, error, refetch } = useAccounts(); // server state
  const activeId = useActiveAccountId();
  const selectAccount = useUiStore((s) => s.selectAccount); // UI state

  return (
    <section aria-labelledby="accounts-heading" aria-busy={isPending} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h2 id="accounts-heading" className="mb-3 text-lg font-semibold">
        Your accounts
      </h2>

      {isPending ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <QueryError message={`We couldn't load your accounts. ${error.message}`} onRetry={() => refetch()} />
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((account) => (
            <li key={account.id}>
              {/* A real <button>: keyboard and screen-reader friendly for free. */}
              <button
                type="button"
                onClick={() => selectAccount(account.id)}
                aria-pressed={account.id === activeId}
                className="flex w-full items-center justify-between rounded-lg border border-line p-3 text-left aria-pressed:border-2 aria-pressed:border-primary"
              >
                <span>
                  <span className="block font-medium">{account.name}</span>
                  <span className="block text-sm opacity-70">
                    {account.sortCode} · {account.accountNumber}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{formatGBP(account.balancePence)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
