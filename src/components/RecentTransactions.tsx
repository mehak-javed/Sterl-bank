"use client";

import Link from "next/link";
import { formatGBP } from "@/lib/money";
import { useActiveAccountId, useTransactions } from "@/lib/api/queries";
import { QueryError, SkeletonRows } from "./QueryStates";

// Show dates in UK time, whatever time zone the viewer's computer is in.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});

export function RecentTransactions() {
  const accountId = useActiveAccountId();
  const { data: transactions, isPending, isError, error, refetch } = useTransactions(accountId, 10);

  return (
    <section aria-labelledby="transactions-heading" aria-busy={isPending} className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="transactions-heading" className="text-lg font-semibold text-heading">
          Recent transactions
        </h2>
        <Link href="/transactions" className="text-sm underline underline-offset-4">
          See all
        </Link>
      </div>

      {isPending ? (
        <SkeletonRows rows={5} />
      ) : isError ? (
        <QueryError message={`We couldn't load your transactions. ${error.message}`} onRetry={() => refetch()} />
      ) : transactions.length === 0 ? (
        <p className="text-sm text-muted">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {transactions.map((t) => {
            const isMoneyIn = t.amountPence > 0;
            return (
              <li key={t.id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  <span className="block font-medium">{t.description}</span>
                  <span className="block text-sm text-muted">
                    <time dateTime={t.date}>{dateFormat.format(new Date(t.date))}</time> · {t.category}
                  </span>
                </span>
                {/* "+" for money in: never rely on colour alone to carry meaning. */}
                <span className={`tabular-nums ${isMoneyIn ? "font-semibold text-positive" : ""}`}>
                  {isMoneyIn ? "+" : ""}
                  {formatGBP(t.amountPence)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
