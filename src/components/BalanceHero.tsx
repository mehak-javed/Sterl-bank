"use client";

import Link from "next/link";
import { useAccounts } from "@/lib/api/queries";
import { formatGBP, sumPence } from "@/lib/money";

/**
 * The one gold block on the dashboard: the customer's total balance.
 * Gold is reserved for the single most important thing on a page; if everything
 * is gold, nothing stands out.
 */
export function BalanceHero() {
  const { data: accounts, isPending, isError, refetch } = useAccounts(); // same cache as AccountsOverview: no extra request

  const roundUps = accounts?.find((a) => a.type === "roundup");

  return (
    <section
      aria-labelledby="balance-heading"
      aria-busy={isPending}
      className="hero-gold flex flex-col gap-4 rounded-3xl p-6 shadow-lg sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h2 id="balance-heading" className="text-sm font-semibold tracking-wide uppercase">
          Total balance
        </h2>

        {isPending ? (
          <p className="mt-2 h-12 w-48 rounded-lg bg-hero-foreground/15 motion-safe:animate-pulse" aria-hidden="true" />
        ) : isError ? (
          <p role="alert" className="mt-2 flex items-center gap-3 font-medium">
            We couldn&apos;t load your balance.
            <button type="button" onClick={() => refetch()} className="underline underline-offset-4">
              Try again
            </button>
          </p>
        ) : (
          <>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatGBP(sumPence(accounts.map((a) => a.balancePence)))}</p>
            <p className="mt-2 text-sm text-hero-foreground/75">
              Across {accounts.length} accounts
              {roundUps && <> · {formatGBP(roundUps.balancePence)} saved from round-ups</>}
            </p>
          </>
        )}
      </div>

      <Link
        href="/markets"
        className="self-start rounded-xl bg-hero-button px-5 py-3 font-semibold text-hero-button-foreground sm:self-auto"
      >
        Open FX desk →
      </Link>
    </section>
  );
}
