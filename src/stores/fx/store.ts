import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { ordersSlice } from "./ordersSlice";
import { watchlistSlice } from "./watchlistSlice";

/**
 * Redux for the FX desk. Why Redux here when the banking side uses Zustand?
 * Trading screens have lots of related events (orders, fills, watchlist changes) and
 * teams need to trace exactly which action changed what. Redux gives every change a
 * named action you can see, replay and test in Redux DevTools. It's also what
 * JPMorgan's postings ask for.
 */
const rootReducer = combineSlices(watchlistSlice, ordersSlice);

/** A factory again: one store per browser session (see ReduxProvider), never shared. */
export function makeFxStore() {
  return configureStore({ reducer: rootReducer });
}

export type FxStore = ReturnType<typeof makeFxStore>;
export type FxState = ReturnType<typeof rootReducer>;
export type FxDispatch = FxStore["dispatch"];

// Typed hooks: use these instead of plain useDispatch/useSelector, so TypeScript knows the state shape.
export const useFxDispatch = useDispatch.withTypes<FxDispatch>();
export const useFxSelector = useSelector.withTypes<FxState>();
