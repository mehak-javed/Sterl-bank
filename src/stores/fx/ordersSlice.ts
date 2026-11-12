import { createSelector, createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import { convertFromPence, type QuoteCurrency } from "@/lib/fx";
import type { Pence } from "@/lib/money";

/** "buy" = buy the quote currency, paying GBP. "sell" = sell the quote currency, receiving GBP. */
export type OrderSide = "buy" | "sell";

export type Order = {
  id: string;
  quote: QuoteCurrency;
  side: OrderSide;
  notionalPence: Pence; // the GBP side of the trade
  rate: number; // snapshot of the rate at the moment of the order
  quoteAmountMinor: number; // the other side, in that currency's minor units
  placedAt: string; // ISO time
  status: "filled"; // paper orders fill instantly; real ones also go "pending", "rejected"...
};

type OrdersState = { orders: Order[] };
const initialState: OrdersState = { orders: [] };

export const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    placeOrder: {
      // Reducers must be PURE: same input, same output, no randomness, no clock.
      // So anything random or time-based (id, timestamp) is created here in `prepare`,
      // before the action reaches the reducer.
      prepare(input: { quote: QuoteCurrency; side: OrderSide; notionalPence: Pence; rate: number }) {
        return {
          payload: {
            ...input,
            id: nanoid(),
            quoteAmountMinor: convertFromPence(input.notionalPence, input.rate, input.quote),
            placedAt: new Date().toISOString(),
            status: "filled" as const,
          },
        };
      },
      reducer(state, action: PayloadAction<Order>) {
        state.orders.unshift(action.payload); // newest first
      },
    },
  },
  selectors: {
    selectOrders: (state) => state.orders,
  },
});

export const { placeOrder } = ordersSlice.actions;
export const { selectOrders } = ordersSlice.selectors;

export type Position = { quote: QuoteCurrency; netQuoteMinor: number; netPence: Pence };

/**
 * Net position per currency (what you'd hold if all these orders settled).
 * createSelector MEMOISES: it only recalculates when `orders` changes, and otherwise
 * returns the same array, so components using it don't re-render for nothing.
 */
export const selectPositions = createSelector([selectOrders], (orders): Position[] => {
  const byQuote = new Map<QuoteCurrency, Position>();
  for (const o of orders) {
    const p = byQuote.get(o.quote) ?? { quote: o.quote, netQuoteMinor: 0, netPence: 0 };
    const sign = o.side === "buy" ? 1 : -1;
    p.netQuoteMinor += sign * o.quoteAmountMinor;
    p.netPence -= sign * o.notionalPence; // buying USD costs GBP
    byQuote.set(o.quote, p);
  }
  return [...byQuote.values()];
});
