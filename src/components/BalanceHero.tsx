import Link from "next/link";
import { formatGBP, sumPence } from "@/lib/money";
import { getAccounts } from "@/server/queries";

/**
 * The one gold block on the dashboard: the customer's total balance.
 *
 * A SERVER Component (no "use client"): it can be async and await data directly.
 * The browser receives finished HTML and none of this component's JavaScript.
 * It has nothing to click except a Link, so it never needs to run in the browser.
 */
export async function BalanceHero() {
  const accounts = await getAccounts();
  const roundUps = accounts.find((a) => a.type === "roundup");

  return (
    <section
      aria-labelledby="balance-heading"
      className="hero-gold flex flex-col gap-4 rounded-3xl p-6 shadow-lg sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h2 id="balance-heading" className="text-sm font-semibold tracking-wide uppercase">
          Total balance
        </h2>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {formatGBP(sumPence(accounts.map((a) => a.balancePence)))}
        </p>
        <p className="mt-2 text-sm text-hero-foreground/75">
          Across {accounts.length} accounts
          {roundUps && <> · {formatGBP(roundUps.balancePence)} saved from round-ups</>}
        </p>
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

/** Shown by <Suspense> while BalanceHero waits for data. Same size, so nothing jumps when it arrives. */
export function BalanceHeroSkeleton() {
  return (
    <section aria-busy="true" aria-label="Total balance" className="hero-gold rounded-3xl p-6 shadow-lg">
      <p className="text-sm font-semibold tracking-wide uppercase">Total balance</p>
      <p className="mt-2 h-12 w-48 rounded-lg bg-hero-foreground/15 motion-safe:animate-pulse" aria-hidden="true" />
      <p className="mt-2 h-5 w-64 rounded bg-hero-foreground/10" aria-hidden="true" />
    </section>
  );
}
