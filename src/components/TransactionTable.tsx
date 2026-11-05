import { formatGBP } from "@/lib/money";
import type { Transaction } from "@/types/bank";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London", // same output on the server and in the browser
});

/**
 * A statement table. No "use client", no hooks, no data fetching: it just turns
 * the transactions it's given into HTML. A component like that is a "shared" component:
 * a Server Component can render it (account page) and so can a Client Component
 * (TransactionsView). Whoever owns the data decides where it runs.
 */
export function TransactionTable({ transactions }: { transactions: readonly Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted">No transactions yet.</p>;
  }

  return (
    // A real <table>: a statement IS tabular data, so screen readers can announce
    // "Amount column, row 3" instead of reading a wall of text.
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Latest {transactions.length} transactions, newest first</caption>
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Date</th>
            <th scope="col" className="py-2 pr-4 font-medium">Description</th>
            <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">Category</th>
            <th scope="col" className="py-2 pl-4 text-right font-medium">Amount</th>
            <th scope="col" className="hidden py-2 pl-4 text-right font-medium sm:table-cell">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {transactions.map((t) => {
            const isMoneyIn = t.amountPence > 0;
            return (
              <tr key={t.id}>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <time dateTime={t.date}>{dateFormat.format(new Date(t.date))}</time>
                </td>
                <td className="py-2 pr-4">{t.description}</td>
                <td className="hidden py-2 pr-4 sm:table-cell">{t.category}</td>
                {/* "+" for money in: never rely on colour alone. */}
                <td className={`py-2 pl-4 text-right whitespace-nowrap tabular-nums ${isMoneyIn ? "font-semibold text-positive" : ""}`}>
                  {isMoneyIn ? "+" : ""}
                  {formatGBP(t.amountPence)}
                </td>
                <td className="hidden py-2 pl-4 text-right tabular-nums sm:table-cell">
                  {formatGBP(t.balanceAfterPence)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
