"use client";

import { useState, type FormEvent } from "react";
import { convertFromPence, formatMinor, formatRate, type QuoteCurrency, type ReferenceRate } from "@/lib/fx";
import { formatGBP, toPence, type Pence } from "@/lib/money";
import { placeOrder, type OrderSide } from "@/stores/fx/ordersSlice";
import { useFxDispatch, useFxSelector } from "@/stores/fx/store";
import { selectWatchlist } from "@/stores/fx/watchlistSlice";

const MAX_ORDER_PENCE: Pence = 100_000_000; // £1,000,000 limit per paper order

/** Returns pence, or an error message the user can act on. */
function parseAmount(text: string): { pence: Pence } | { error: string } {
  let pence: Pence;
  try {
    // toPence is strict on purpose (your Lesson 1 decision), so trimming happens here, in the form.
    pence = toPence(text.trim());
  } catch {
    return { error: "Enter an amount in pounds, like 250 or 250.50." };
  }
  if (pence === 0) return { error: "Enter an amount greater than £0." };
  if (pence > MAX_ORDER_PENCE) return { error: `The most you can trade is ${formatGBP(MAX_ORDER_PENCE)}.` };
  return { pence };
}

export function OrderTicket({ rates }: { rates: Map<QuoteCurrency, ReferenceRate> }) {
  const dispatch = useFxDispatch();
  const watchlist = useFxSelector(selectWatchlist);
  const [quote, setQuote] = useState<QuoteCurrency | "">(watchlist[0] ?? "");
  const [side, setSide] = useState<OrderSide>("buy");
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // If the chosen pair was removed from the watchlist, fall back to the first one.
  const selectedQuote = quote && watchlist.includes(quote) ? quote : watchlist[0];
  const rate = selectedQuote ? rates.get(selectedQuote)?.rate : undefined;

  // Live preview while typing (only when the amount is valid).
  const parsed = amountText ? parseAmount(amountText) : null;
  const preview =
    parsed && "pence" in parsed && rate && selectedQuote
      ? formatMinor(convertFromPence(parsed.pence, rate, selectedQuote), selectedQuote)
      : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setConfirmation(null);
    if (!selectedQuote || !rate) return setError("Choose a currency pair with a rate.");
    const result = parseAmount(amountText);
    if ("error" in result) return setError(result.error);

    setError(null);
    const action = dispatch(placeOrder({ quote: selectedQuote, side, notionalPence: result.pence, rate }));
    const o = action.payload;
    setConfirmation(
      `${o.side === "buy" ? "Bought" : "Sold"} ${formatMinor(o.quoteAmountMinor, o.quote)} ` +
        `${o.side === "buy" ? "for" : "and received"} ${formatGBP(o.notionalPence)} at ${formatRate(o.rate)}.`,
    );
    setAmountText("");
  }

  return (
    <section aria-labelledby="ticket-heading" className="glass rounded-2xl p-4">
      <h2 id="ticket-heading" className="text-lg font-semibold text-heading">Order ticket</h2>
      <p className="mb-3 text-sm text-muted">Paper orders only: nothing is traded and no money moves.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="ticket-pair" className="text-sm font-medium">Currency pair</label>
          <select
            id="ticket-pair"
            value={selectedQuote ?? ""}
            onChange={(e) => setQuote(e.target.value as QuoteCurrency)}
            className="rounded-md border border-line bg-background px-2 py-1"
          >
            {watchlist.map((q) => (
              <option key={q} value={q}>GBP/{q}</option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Direction</legend>
          <div className="mt-1 flex gap-4">
            {(["buy", "sell"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="side" value={s} checked={side === s} onChange={() => setSide(s)} />
                {s === "buy" ? `Buy ${selectedQuote ?? ""}` : `Sell ${selectedQuote ?? ""}`}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="ticket-amount" className="text-sm font-medium">Amount in GBP (£)</label>
          <input
            id="ticket-amount"
            // type="text" + inputMode="decimal": a number keypad on phones, but we parse the
            // exact text ourselves (type="number" would hand us a float).
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "ticket-error" : "ticket-preview"}
            className="rounded-md border border-line bg-background px-2 py-1 font-mono"
          />
          <p id="ticket-preview" className="text-sm text-muted">
            {preview && rate ? `≈ ${preview} at ${formatRate(rate)}` : " "}
          </p>
        </div>

        {error && (
          <p id="ticket-error" role="alert" className="text-sm font-medium">{error}</p>
        )}

        <button type="submit" className="rounded-xl btn-primary px-4 py-2 font-semibold">
          Place paper order
        </button>

        <p role="status" className="text-sm">{confirmation}</p>
      </form>
    </section>
  );
}
