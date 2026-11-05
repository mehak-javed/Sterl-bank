"use client";

import { useState } from "react";
import { formatRate, SUPPORTED_QUOTES, type QuoteCurrency, type ReferenceRate } from "@/lib/fx";
import { useFxDispatch, useFxSelector } from "@/stores/fx/store";
import { addToWatchlist, removeFromWatchlist, selectWatchlist } from "@/stores/fx/watchlistSlice";

export function Watchlist({ rates }: { rates: Map<QuoteCurrency, ReferenceRate> }) {
  const quotes = useFxSelector(selectWatchlist);
  const dispatch = useFxDispatch();
  const available = SUPPORTED_QUOTES.filter((q) => !quotes.includes(q) && rates.has(q));
  const [toAdd, setToAdd] = useState<QuoteCurrency | "">("");

  return (
    <section aria-labelledby="watchlist-heading" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h2 id="watchlist-heading" className="mb-3 text-lg font-semibold">
        Watchlist
      </h2>

      {/* A real <table> with <th scope>: screen readers read "Pair: GBP/USD, Rate: 1.3469". */}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2">Pair</th>
            <th scope="col" className="py-2 text-right">Rate</th>
            <th scope="col" className="py-2 text-right">Date</th>
            <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const r = rates.get(q);
            return (
              <tr key={q} className="border-b border-line last:border-0">
                <th scope="row" className="py-2 font-medium">GBP/{q}</th>
                <td className="py-2 text-right font-mono tabular-nums">{r ? formatRate(r.rate) : "—"}</td>
                <td className="py-2 text-right opacity-70">{r?.date ?? "—"}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => dispatch(removeFromWatchlist(q))}
                    aria-label={`Remove GBP/${q} from watchlist`}
                    className="rounded px-2 opacity-70 hover:opacity-100"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (toAdd) dispatch(addToWatchlist(toAdd));
          setToAdd("");
        }}
      >
        <label htmlFor="add-pair" className="sr-only">Currency pair to add</label>
        <select
          id="add-pair"
          value={toAdd}
          onChange={(e) => setToAdd(e.target.value as QuoteCurrency | "")}
          className="flex-1 rounded-md border border-line bg-background px-2 py-1"
        >
          <option value="">Add a pair…</option>
          {available.map((q) => (
            <option key={q} value={q}>GBP/{q}</option>
          ))}
        </select>
        <button type="submit" disabled={!toAdd} className="rounded-md border border-line px-3 py-1 font-medium disabled:opacity-50">
          Add
        </button>
      </form>
    </section>
  );
}
