"use client";

import { formatMinor, formatRate } from "@/lib/fx";
import { formatGBP } from "@/lib/money";
import { selectOrders, selectPositions } from "@/stores/fx/ordersSlice";
import { useFxSelector } from "@/stores/fx/store";

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeStyle: "medium", timeZone: "Europe/London" });

/** "Blotter" is the trading-desk word for the running list of today's orders. */
export function OrderBlotter() {
  const orders = useFxSelector(selectOrders);
  const positions = useFxSelector(selectPositions);

  return (
    <section aria-labelledby="blotter-heading" className="glass rounded-2xl p-4">
      <h2 id="blotter-heading" className="mb-3 text-lg font-semibold text-heading">Orders</h2>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">No orders yet. Place one with the order ticket.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2">Time</th>
                <th scope="col" className="py-2">Side</th>
                <th scope="col" className="py-2">Pair</th>
                <th scope="col" className="py-2 text-right">GBP</th>
                <th scope="col" className="py-2 text-right">Rate</th>
                <th scope="col" className="py-2 text-right">Amount</th>
                <th scope="col" className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="py-2"><time dateTime={o.placedAt}>{timeFormat.format(new Date(o.placedAt))}</time></td>
                  <td className="py-2 font-medium">{o.side === "buy" ? "Buy" : "Sell"}</td>
                  <td className="py-2">GBP/{o.quote}</td>
                  <td className="py-2 text-right">{formatGBP(o.notionalPence)}</td>
                  <td className="py-2 text-right font-mono">{formatRate(o.rate)}</td>
                  <td className="py-2 text-right">{formatMinor(o.quoteAmountMinor, o.quote)}</td>
                  <td className="py-2 text-right">Filled</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {positions.length > 0 && (
        <>
          <h3 className="mt-4 mb-2 font-semibold">Net positions</h3>
          <ul className="flex flex-col gap-1 text-sm tabular-nums">
            {positions.map((p) => (
              <li key={p.quote}>
                {p.quote}: {formatMinor(p.netQuoteMinor, p.quote)} (GBP {formatGBP(p.netPence)})
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
