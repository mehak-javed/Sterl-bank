"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createUiStore, type UiStore, type UiStoreApi } from "./ui-store";

const UiStoreContext = createContext<UiStoreApi | null>(null);

export function UiStoreProvider({ children }: { children: ReactNode }) {
  // useState with a function runs createUiStore once, on the first render only.
  const [store] = useState(createUiStore);

  useEffect(() => {
    // 1. Load saved preferences now that we're safely in the browser.
    void store.persist.rehydrate();

    // 2. Mirror preferences onto <html> as data attributes; globals.css styles from them.
    const apply = ({ theme, highContrast, largeText }: UiStore) => {
      const root = document.documentElement;
      if (theme === "system") delete root.dataset.theme;
      else root.dataset.theme = theme;
      root.dataset.contrast = highContrast ? "high" : "normal";
      root.dataset.textSize = largeText ? "large" : "normal";
    };
    apply(store.getState());
    return store.subscribe(apply); // subscribe returns an unsubscribe function: our cleanup
  }, [store]);

  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>;
}

/**
 * Read from the store with a selector, e.g. `useUiStore((s) => s.theme)`.
 * The component re-renders only when the value you selected changes.
 */
export function useUiStore<T>(selector: (state: UiStore) => T): T {
  const store = useContext(UiStoreContext);
  if (!store) throw new Error("useUiStore must be used inside <UiStoreProvider>");
  return useStore(store, selector);
}
