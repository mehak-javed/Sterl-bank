import { CustomerFirstName } from "@/components/shell/CustomerChip";
import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, Send } from "lucide-react";
import { AddCard } from "@/components/AddCard";
import { AddMoney } from "@/components/AddMoney";
import { BalanceHero, BalanceHeroSkeleton } from "@/components/BalanceHero";
import { AccountsOverview, AccountsOverviewSkeleton } from "@/components/AccountsOverview";
import { CardPanel } from "@/components/CardPanel";
import { MoveMoney, MoveMoneySkeleton } from "@/components/MoveMoney";
import { RecentTransactions } from "@/components/RecentTransactions";
import { SpendingSummary, SpendingSummarySkeleton } from "@/components/SpendingSummary";

const QUICK_ACTIONS = [
  { href: "/payments", label: "Pay someone", icon: Send },
  { href: "/cards", label: "Card controls", icon: CreditCard },
] as const;

/**
 * The dashboard: the logged-in customer's own data from the Java API. Server Components (balances,
 * accounts, spending) and Client Components (cards, activity, forms) side by side. A new customer sees
 * £0.00, no payments and "Add money" / "Add a card", never anyone else's data. Each server block that waits for data has its own <Suspense>,
 * so the page appears at once and each block streams in when ready.
 *
 * Layout: one column on phones; a 12-column grid on large screens, the most important thing
 * (the total) biggest and first.
 */
export default function DashboardPage() {
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-muted">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-heading sm:text-4xl"><CustomerFirstName /></h1>
        </div>
        <nav aria-label="Quick actions">
          <ul className="flex gap-2 overflow-x-auto">
            {/* Add money and Add a card: how a new customer fills an empty account. */}
            <li>
              <AddMoney />
            </li>
            <li>
              <AddCard />
            </li>
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold whitespace-nowrap hover:border-accent"
                >
                  <Icon aria-hidden="true" className="h-4 w-4 text-heading" strokeWidth={2} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* grid-cols-1 (not just "grid"): an explicit minmax(0, 1fr) column lets content shrink on phones. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Suspense fallback={<BalanceHeroSkeleton />}>
            <BalanceHero />
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <CardPanel />
        </div>

        <div className="lg:col-span-7">
          <Suspense fallback={<AccountsOverviewSkeleton />}>
            <AccountsOverview />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<SpendingSummarySkeleton />}>
            <SpendingSummary />
          </Suspense>
        </div>

        <div className="lg:col-span-7">
          {/* Stays a Client Component: what it shows depends on the account you pick (browser state). */}
          <RecentTransactions />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Suspense fallback={<MoveMoneySkeleton />}>
            <MoveMoney />
          </Suspense>
        </div>
      </div>
    </>
  );
}
