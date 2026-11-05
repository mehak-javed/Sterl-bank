"use client";

import { useMemo } from "react";
import { useReferenceRates } from "@/lib/api/queries";
import type { QuoteCurrency, ReferenceRate } from "@/lib/fx";
import { QueryError, SkeletonRows } from "../QueryStates";
import { OrderBlotter } from "./OrderBlotter";
import { OrderTicket } from "./OrderTicket";
import { Watchlist } from "./Watchlist";

export function FxDesk() {
  const { data, isPending, isError, error, refetch } = useReferenceRates(); // server state (TanStack)

  // Map for O(1) lookups by currency. useMemo: only rebuilt when the rates change.
  const rates = useMemo(
    () => new Map<QuoteCurrency, ReferenceRate>(data?.rates.map((r) => [r.quote, r])),
    [data],
  );

  if (isPending) {
    return (
      <div aria-busy="true" className="glass rounded-2xl p-4">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (isError) {
    return <QueryError message={`We couldn't load FX rates. ${error.message}`} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="glass rounded-xl p-3 text-sm">
        {data.source === "live"
          ? "Daily central-bank reference rates via Frankfurter. Not live prices and not for trading."
          : `Live reference rates are unavailable, so these are saved rates from ${data.rates[0]?.date}. Not for trading.`}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Watchlist rates={rates} />
        <OrderTicket rates={rates} />
      </div>
      <OrderBlotter />
    </div>
  );
}
