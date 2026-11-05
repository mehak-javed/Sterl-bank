import Link from "next/link";
import { formatGBP } from "@/lib/money";
import { getAccounts } from "@/server/queries";
import { AccountSelectButton } from "./AccountSelectButton";
import { SkeletonRows } from "./QueryStates";

/**
 * Server Component: the list and every balance are rendered on the server.
 * Only <AccountSelectButton> (the click to choose an account) runs in the browser.
 */
export async function AccountsOverview() {
  const accounts = await getAccounts(); // same request as BalanceHero: React cache() shares it

  return (
    <section aria-labelledby="accounts-heading" className="glass rounded-2xl p-4">
      <h2 id="accounts-heading" className="mb-3 text-lg font-semibold text-heading">
        Your accounts
      </h2>
      <ul className="flex flex-col gap-2">
        {accounts.map((account) => (
          <li key={account.id} className="flex gap-2">
            <AccountSelectButton accountId={account.id}>
              {/* Server-rendered content passed into a Client Component as children. */}
              <span>
                <span className="block font-medium">{account.name}</span>
                <span className="block text-sm text-muted">
                  {account.sortCode} · {account.accountNumber}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{formatGBP(account.balancePence)}</span>
            </AccountSelectButton>
            {/* Next to the button, not inside it: HTML doesn't allow a link inside a button. */}
            <Link
              href={`/accounts/${account.id}`}
              aria-label={`${account.name} details`}
              className="grid place-items-center rounded-lg border border-line px-3 text-sm"
            >
              Details
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AccountsOverviewSkeleton() {
  return (
    <section aria-busy="true" aria-label="Your accounts" className="glass rounded-2xl p-4">
      <p className="mb-3 text-lg font-semibold text-heading">Your accounts</p>
      <SkeletonRows rows={3} />
    </section>
  );
}
