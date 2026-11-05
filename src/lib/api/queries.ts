import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/stores/UiStoreProvider";
import type { ReferenceRates } from "@/lib/fx";
import type { Account, Card, Transaction } from "@/types/bank";
import { apiFetch } from "./client";

/**
 * Query keys in one place. A key is the cache address for a piece of server data:
 * two components asking for the same key share ONE request and ONE cached copy.
 */
export const queryKeys = {
  accounts: ["accounts"] as const,
  transactions: (accountId: string, limit: number) => ["transactions", accountId, { limit }] as const,
  cards: ["cards"] as const,
  fxReference: ["fx", "reference"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    // `signal` lets TanStack cancel the request if nobody needs it any more.
    queryFn: ({ signal }) => apiFetch<Account[]>("/api/accounts", { signal }),
  });
}

/** The account the user picked (Zustand), or the first account until they pick one. */
export function useActiveAccountId(): string | null {
  const selected = useUiStore((s) => s.selectedAccountId);
  const { data: accounts } = useAccounts();
  return selected ?? accounts?.[0]?.id ?? null;
}

export function useTransactions(accountId: string | null, limit = 10) {
  return useQuery({
    queryKey: queryKeys.transactions(accountId ?? "none", limit),
    // skipToken = "don't fetch yet" (no account chosen), and keeps the types honest.
    queryFn: accountId
      ? ({ signal }) =>
          apiFetch<Transaction[]>(
            `/api/transactions?${new URLSearchParams({ accountId, limit: String(limit) })}`,
            { signal },
          )
      : skipToken,
  });
}

export function useCards() {
  return useQuery({
    queryKey: queryKeys.cards,
    queryFn: ({ signal }) => apiFetch<Card[]>("/api/cards", { signal }),
  });
}

/** Daily reference rates change once a day, so treat them as fresh for an hour. */
export function useReferenceRates() {
  return useQuery({
    queryKey: queryKeys.fxReference,
    queryFn: ({ signal }) => apiFetch<ReferenceRates>("/api/fx/reference", { signal }),
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Freeze / unfreeze with an OPTIMISTIC update: the screen changes instantly, then
 * the server confirms. If the server says no, we roll back to exactly what was there.
 */
export function useSetCardFrozen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, frozen }: { cardId: string; frozen: boolean }) =>
      apiFetch<Card>(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frozen }),
      }),

    onMutate: async ({ cardId, frozen }) => {
      // 1. Stop any in-flight refetch, so an old response can't overwrite our optimistic value.
      await queryClient.cancelQueries({ queryKey: queryKeys.cards });
      // 2. Snapshot what's on screen now, for rollback.
      const previous = queryClient.getQueryData<Card[]>(queryKeys.cards);
      // 3. Show the change immediately. Return a NEW array (never mutate cached data).
      queryClient.setQueryData<Card[]>(queryKeys.cards, (cards) =>
        cards?.map((c) => (c.id === cardId ? { ...c, frozen } : c)),
      );
      return { previous }; // passed to onError below
    },

    onError: (_error, _variables, onMutateResult) => {
      // 4. Server said no: put the snapshot back.
      if (onMutateResult?.previous) queryClient.setQueryData(queryKeys.cards, onMutateResult.previous);
    },

    onSettled: () => {
      // 5. Success or failure, re-fetch so the screen matches the server's truth.
      return queryClient.invalidateQueries({ queryKey: queryKeys.cards });
    },
  });
}
