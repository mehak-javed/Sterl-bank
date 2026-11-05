import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/**
 * Sterl's UI store (Zustand): state that lives only in the browser.
 *
 * Rule of thumb for this project:
 *   - Server state (accounts, balances, transactions) → TanStack Query (Day 5).
 *     It belongs to the bank; the browser only holds a cached copy.
 *   - UI state (which account is selected, theme, accessibility) → this store.
 *     It belongs to this browser tab and nobody else needs it.
 *
 * Card freeze used to live here (Day 4). It moved to TanStack Query on Day 5 because
 * freezing a card is a bank setting the server owns: see useSetCardFrozen in lib/api/queries.ts.
 */

export type Theme = "system" | "light" | "dark";

export type UiState = {
  selectedAccountId: string | null;
  theme: Theme;
  highContrast: boolean;
  largeText: boolean;
};

export type UiActions = {
  selectAccount: (accountId: string) => void;
  setTheme: (theme: Theme) => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
};

export type UiStore = UiState & UiActions;

export const defaultUiState: UiState = {
  selectedAccountId: null,
  theme: "dark", // Sterl's brand look; visitors can switch to light or "match device"
  highContrast: false,
  largeText: false,
};

/**
 * A factory, not a single global store. In Next.js the server handles many visitors in the
 * same process, so a module-level store would be shared between them. Creating one store
 * per browser session (see UiStoreProvider) avoids one visitor's state leaking into another's.
 */
export function createUiStore(initial: UiState = defaultUiState) {
  return createStore<UiStore>()(
    persist(
      (set) => ({
        ...initial,
        selectAccount: (accountId) => set({ selectedAccountId: accountId }),
        setTheme: (theme) => set({ theme }),
        // Use the function form of set() when the new value depends on the old one.
        toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
        toggleLargeText: () => set((s) => ({ largeText: !s.largeText })),
      }),
      {
        name: "sterl-ui", // localStorage key
        version: 1, // bump (and add `migrate`) if the saved shape ever changes
        storage: createJSONStorage(() => localStorage),
        // Only remember display preferences between visits.
        partialize: ({ theme, highContrast, largeText }) => ({ theme, highContrast, largeText }),
        // Don't read localStorage while creating the store; UiStoreProvider does it after the
        // first render, so the server HTML and the first browser render match (no hydration error).
        skipHydration: true,
      },
    ),
  );
}

export type UiStoreApi = ReturnType<typeof createUiStore>;
