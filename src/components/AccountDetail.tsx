import { formatGBP } from "@/lib/money";
import type { Account, Transaction } from "@/types/bank";
import { SkeletonRows } from "./QueryStates";
import { TransactionTable } from "./TransactionTable";

/** Same shape as AccountDetail, so nothing jumps when the real content streams in. */
export function AccountDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading account" className="flex flex-col gap-6">
      <div className="hero-gold rounded-3xl p-6 shadow-lg" aria-hidden="true">
        <p className="h-5 w-40 rounded bg-hero-foreground/15" />
        <p className="mt-3 h-12 w-48 rounded-lg bg-hero-foreground/15 motion-safe:animate-pulse" />
        <p className="mt-3 h-5 w-56 rounded bg-hero-foreground/10" />
      </div>
      <div className="glass rounded-2xl p-4">
        <SkeletonRows rows={8} />
      </div>
    </div>
  );
}

/**
 * Server Component. Nothing here is interactive (a balance, a statement, a Link),
 * so it ships as plain HTML: no JavaScript sent to the browser for it.
 * The page fetches the data and passes it in.
 */
export function AccountDetail({ account, transactions }: { account: Account; transactions: readonly Transaction[] }) {
  return (
    <>
      {/* This page's one gold block: the balance of this account. */}
      <section className="hero-gold rounded-3xl p-6 shadow-lg">
        <h1 className="text-sm font-semibold tracking-wide uppercase">{account.name}</h1>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {formatGBP(account.balancePence)}
        </p>
        <p className="mt-2 text-sm text-hero-foreground/75">
          {account.sortCode} · {account.accountNumber}
        </p>
      </section>

      <section aria-labelledby="statement-heading" className="glass rounded-2xl p-4">
        <h2 id="statement-heading" className="mb-3 text-lg font-semibold text-heading">
          Transactions
        </h2>
        <TransactionTable transactions={transactions} />
      </section>
    </>
  );
}
