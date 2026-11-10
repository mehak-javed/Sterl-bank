import Link from "next/link";
import { ChevronRight, Coins, type LucideIcon, PiggyBank, Wallet } from "lucide-react";
import type { Account } from "@/types/bank";
import { getAccounts } from "@/server/queries";
import { AccountSelectButton } from "./AccountSelectButton";
import { SkeletonRows } from "./QueryStates";
import { Money } from "./ui/Money";

const ACCOUNT_ICONS: Record<Account["type"], LucideIcon> = {
  current: Wallet,
  saver: PiggyBank,
  roundup: Coins,
};

/**
 * Server Component: the list and every balance are rendered on the server.
 * Only <AccountSelectButton> (choosing which account the activity list shows) runs in the browser.
 */
export async function AccountsOverview() {
  const accounts = await getAccounts(); // same request as BalanceHero: React cache() shares it

  return (
    <section aria-labelledby="accounts-heading" className="rise-in glass flex h-full flex-col gap-4 rounded-3xl p-5">
      <h2 id="accounts-heading" className="text-lg font-semibold text-heading">
        Your accounts
      </h2>
      <ul className="flex flex-col gap-2">
        {accounts.map((account) => {
          const Icon = ACCOUNT_ICONS[account.type];
          return (
            <li key={account.id} className="flex gap-2">
              <AccountSelectButton accountId={account.id}>
                {/* Server-rendered content passed into a Client Component as children. */}
                <span className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="chip h-10 w-10">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{account.name}</span>
                    <span className="block text-sm text-muted tabular-nums">
                      {account.sortCode} · {account.accountNumber}
                    </span>
                  </span>
                </span>
                <Money pence={account.balancePence} className="text-lg font-semibold" />
              </AccountSelectButton>
              {/* Next to the button, not inside it: HTML doesn't allow a link inside a button. */}
              <Link
                href={`/accounts/${account.id}`}
                aria-label={`${account.name} details`}
                className="grid w-11 shrink-0 place-items-center rounded-2xl border border-line text-muted hover:bg-surface-2 hover:text-foreground"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AccountsOverviewSkeleton() {
  return (
    <section aria-busy="true" aria-label="Your accounts" className="glass flex flex-col gap-4 rounded-3xl p-5">
      <p className="text-lg font-semibold text-heading">Your accounts</p>
      <SkeletonRows rows={3} />
    </section>
  );
}
