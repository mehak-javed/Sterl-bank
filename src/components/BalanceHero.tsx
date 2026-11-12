import { Coins } from "lucide-react";
import { formatGBP, sumPence } from "@/lib/money";
import { getAccounts } from "@/server/queries";
import { AddMoney } from "./AddMoney";
import { Money } from "./ui/Money";

/** Three shades of the dark text colour, so each account has its own band on the gold. */
const SHADES = ["bg-hero-foreground", "bg-hero-foreground/55", "bg-hero-foreground/25"];

/**
 * The one gold block on the dashboard: the total, and where it sits.
 *
 * A SERVER Component (no "use client"): it awaits its data directly, and the browser receives
 * finished HTML and none of this component's JavaScript.
 */
export async function BalanceHero() {
  const accounts = await getAccounts();
  const total = sumPence(accounts.map((a) => a.balancePence));
  const roundUps = accounts.find((a) => a.type === "roundup");

  return (
    <section aria-labelledby="balance-heading" className="rise-in hero-gold flex h-full flex-col justify-between gap-6 rounded-3xl p-6 shadow-lg sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="balance-heading" className="eyebrow opacity-80">
            Total balance
          </h2>
          <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">
            <Money pence={total} />
          </p>
          <p className="mt-2 text-sm font-medium opacity-80">
            {total === 0
              ? "Your account is ready. Add money to get started."
              : accounts.length === 1
                ? `In your ${accounts[0].name}`
                : `Across ${accounts.length} accounts`}
          </p>
        </div>
        <AddMoney triggerClassName="flex items-center gap-2 rounded-full bg-hero-button px-4 py-2 text-sm font-semibold text-hero-button-foreground shadow-sm" />
        {roundUps && roundUps.balancePence > 0 && (
          <p className="flex items-center gap-2 rounded-full bg-hero-foreground/10 px-3 py-1.5 text-sm font-semibold">
            <Coins aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            {formatGBP(roundUps.balancePence)} saved from round-ups
          </p>
        )}
      </div>

      {/* Where the money sits. The bar is decoration; the list below says the same in words. */}
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-hero-foreground/10">
          {accounts.map((account, i) => (
            <span
              key={account.id}
              className={SHADES[i % SHADES.length]}
              // A width from integers: the share of the total in whole hundredths of a percent.
              style={{ width: `${total > 0 ? Math.round((account.balancePence * 10000) / total) / 100 : 0}%` }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {accounts.map((account, i) => (
            <li key={account.id} className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${SHADES[i % SHADES.length]}`} />
              <span className="font-medium">{account.name}</span>
              <span className="tabular-nums opacity-80">{formatGBP(account.balancePence)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Shown by <Suspense> while BalanceHero waits for data. Same size, so nothing jumps when it arrives. */
export function BalanceHeroSkeleton() {
  return (
    <section aria-busy="true" aria-label="Total balance" className="hero-gold flex flex-col gap-6 rounded-3xl p-6 shadow-lg sm:p-8">
      <div>
        <p className="eyebrow opacity-80">Total balance</p>
        <p aria-hidden="true" className="mt-3 h-14 w-56 rounded-xl bg-hero-foreground/15 motion-safe:animate-pulse" />
        <p aria-hidden="true" className="mt-3 h-4 w-32 rounded bg-hero-foreground/10" />
      </div>
      <p aria-hidden="true" className="h-2.5 rounded-full bg-hero-foreground/10" />
    </section>
  );
}
