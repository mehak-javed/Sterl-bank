import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { QuoteCurrency } from "@/lib/fx";

type WatchlistState = { quotes: QuoteCurrency[] };

const initialState: WatchlistState = { quotes: ["USD", "EUR", "JPY", "CHF"] };

/**
 * A slice = one feature's state + the reducers that change it.
 * createSlice also generates the action creators (addToWatchlist, removeFromWatchlist).
 */
export const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    addToWatchlist(state, action: PayloadAction<QuoteCurrency>) {
      // Looks like mutation, but Redux Toolkit uses Immer: it records these changes and
      // produces a brand-new state object. The old state is never touched.
      if (!state.quotes.includes(action.payload)) state.quotes.push(action.payload);
    },
    removeFromWatchlist(state, action: PayloadAction<QuoteCurrency>) {
      state.quotes = state.quotes.filter((q) => q !== action.payload);
    },
  },
  selectors: {
    selectWatchlist: (state) => state.quotes,
  },
});

export const { addToWatchlist, removeFromWatchlist } = watchlistSlice.actions;
export const { selectWatchlist } = watchlistSlice.selectors;
