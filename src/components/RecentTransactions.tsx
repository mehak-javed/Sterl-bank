"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { groupByUkDay } from "@/lib/activity";
import { useActiveAccountId, useTransactions } from "@/lib/api/queries";
import { QueryError, SkeletonRows } from "./QueryStates";
import { CategoryIcon } from "./ui/CategoryIcon";
import { Money } from "./ui/Money";

/**
 * The latest activity on the account picked in "Your accounts", grouped by day.
 * A Client Component: which account it shows is browser state (Zustand), and it refetches on change.
 */
export function RecentTransactions() {
  const accountId = useActiveAccountId();
  const { data: transactions, isPending, isError, error, refetch } = useTransactions(accountId, 8);

  return (
    <section aria-labelledby="transactions-heading" aria-busy={isPending} className="rise-in glass flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h2 id="transactions-heading" className="text-lg font-semibold text-heading">
          Recent activity
        </h2>
        <Link href="/transactions" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
          See all <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      {isPending ? (
        <SkeletonRows rows={5} />
      ) : isError ? (
        <QueryError message={`We couldn't load your transactions. ${error.message}`} onRetry={() => refetch()} />
      ) : transactions.length === 0 ? (
        <p className="text-sm text-muted">No payments yet. Money you add or spend will show up here.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groupByUkDay(transactions).map((day) => (
            <section key={day.key} aria-labelledby={`day-${day.key}`}>
              <h3 id={`day-${day.key}`} className="eyebrow mb-2 text-muted">
                {day.label}
              </h3>
              <ul className="flex flex-col">
                {day.transactions.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl px-1 py-2.5">
                    <CategoryIcon category={t.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.description}</span>
                      <span className="block text-sm text-muted">{t.category}</span>
                    </span>
                    {/* "+" for money in, as well as colour: never rely on colour alone. */}
                    <Money
                      pence={t.amountPence}
                      showPlus
                      className={`font-semibold ${t.amountPence > 0 ? "text-positive" : ""}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
