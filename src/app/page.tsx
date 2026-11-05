import { BalanceHero } from "@/components/BalanceHero";
import { AccountsOverview } from "@/components/AccountsOverview";
import { CardPanel } from "@/components/CardPanel";
import { DisplaySettings } from "@/components/DisplaySettings";
import { RecentTransactions } from "@/components/RecentTransactions";

// Temporary home for Week 1 pieces. Day 8 splits these into real pages (dashboard, cards...).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-heading">Sterl</h1>
        <p className="mt-1 text-lg">
          A demo bank: personal banking on one side, a live FX desk on the other.
        </p>
      </header>

      <BalanceHero />

      <div className="grid gap-6 md:grid-cols-2">
        <AccountsOverview />
        <CardPanel />
      </div>
      <RecentTransactions />
      <DisplaySettings />
    </main>
  );
}
