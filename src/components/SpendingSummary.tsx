import { formatGBP } from "@/lib/money";
import { monthLabel } from "@/lib/spending";
import { getMonthlySpending } from "@/server/queries";
import { SkeletonRows } from "./QueryStates";
import { CategoryIcon } from "./ui/CategoryIcon";
import { Money } from "./ui/Money";

/** How many categories to list; the rest are added together as "Everything else". */
const SHOWN = 5;

/**
 * "Where did my money go?" for the latest month. A Server Component: the totals are worked out on
 * the server (in whole pence, see lib/spending.ts) and arrive as finished HTML.
 */
export async function SpendingSummary() {
  const spending = await getMonthlySpending();

  if (spending === null || spending.totalPence === 0) {
    return (
      <section aria-labelledby="spending-heading" className="glass flex flex-col gap-2 rounded-3xl p-5">
        <h2 id="spending-heading" className="text-lg font-semibold text-heading">
          Spending
        </h2>
        <p className="text-sm text-muted">No spending yet this month.</p>
      </section>
    );
  }

  const shown = spending.categories.slice(0, SHOWN);
  const restPence = spending.categories.slice(SHOWN).reduce((sum, c) => sum + c.pence, 0);

  return (
    <section aria-labelledby="spending-heading" className="rise-in glass flex h-full flex-col gap-4 rounded-3xl p-5">
      <div>
        <h2 id="spending-heading" className="text-lg font-semibold text-heading">
          Spending in {monthLabel(spending.month)}
        </h2>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          <Money pence={spending.totalPence} />
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {shown.map(({ category, pence, share }) => (
          <li key={category} className="flex items-center gap-3">
            <CategoryIcon category={category} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{category}</span>
                <span className="font-semibold tabular-nums">{formatGBP(pence)}</span>
              </div>
              {/* The bar shows the share; the amount beside it says it in words. */}
              <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full btn-primary" style={{ width: `${Math.max(2, Math.round(share * 100))}%` }} />
              </div>
            </div>
          </li>
        ))}
        {restPence > 0 && (
          <li className="flex items-center justify-between text-sm text-muted">
            <span>Everything else</span>
            <span className="tabular-nums">{formatGBP(restPence)}</span>
          </li>
        )}
      </ul>
    </section>
  );
}

export function SpendingSummarySkeleton() {
  return (
    <section aria-busy="true" aria-label="Spending" className="glass flex flex-col gap-4 rounded-3xl p-5">
      <p className="text-lg font-semibold text-heading">Spending</p>
      <SkeletonRows rows={4} />
    </section>
  );
}
