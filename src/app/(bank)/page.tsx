import { Suspense } from "react";
import { BalanceHero, BalanceHeroSkeleton } from "@/components/BalanceHero";
import { AccountsOverview, AccountsOverviewSkeleton } from "@/components/AccountsOverview";
import { CardPanel } from "@/components/CardPanel";
import { DisplaySettings } from "@/components/DisplaySettings";
import { MoveMoney, MoveMoneySkeleton } from "@/components/MoveMoney";
import { RoundUpSetting, RoundUpSettingSkeleton } from "@/components/RoundUpSetting";
import { RecentTransactions } from "@/components/RecentTransactions";

/**
 * Server Components (BalanceHero, AccountsOverview) and Client Components (CardPanel,
 * RecentTransactions, DisplaySettings) side by side.
 *
 * Each server part that waits for data gets its own <Suspense>: the rest of the page
 * (heading, card, settings) shows straight away, and each block streams in when ready.
 * With Cache Components on, Next refuses to build if fresh data is read outside Suspense.
 */
export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Dashboard</h1>
      <Suspense fallback={<BalanceHeroSkeleton />}>
        <BalanceHero />
      </Suspense>
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<AccountsOverviewSkeleton />}>
          <AccountsOverview />
        </Suspense>
        <CardPanel />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<MoveMoneySkeleton />}>
          <MoveMoney />
        </Suspense>
        <Suspense fallback={<RoundUpSettingSkeleton />}>
          <RoundUpSetting />
        </Suspense>
      </div>
      {/* Stays a Client Component: what it shows depends on the account you click (browser state). */}
      <RecentTransactions />
      <DisplaySettings />
    </>
  );
}
