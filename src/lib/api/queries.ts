import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/stores/UiStoreProvider";
import type { ReferenceRates } from "@/lib/fx";
import type { Account, Card, CardProduct, HeldPayment, Payment, SavedPayee, Transaction } from "@/types/bank";
import { apiFetch, apiSend } from "./client";

/**
 * Query keys in one place. A key is the cache address for a piece of server data:
 * two components asking for the same key share ONE request and ONE cached copy.
 */
export const queryKeys = {
  accounts: ["accounts"] as const,
  transactions: (accountId: string, limit: number) => ["transactions", accountId, { limit }] as const,
  cards: ["cards"] as const,
  fxReference: ["fx", "reference"] as const,
  payees: ["payees"] as const,
  payments: ["payments"] as const,
  heldPayments: ["risk", "held-payments"] as const,
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
    // The Java API pages statements (at most 100 per page); we only ever show the newest.
    queryFn: accountId
      ? async ({ signal }) =>
          (
            await apiFetch<{ items: Transaction[] }>(
              `/api/accounts/${encodeURIComponent(accountId)}/transactions?size=${Math.min(limit, 100)}`,
              { signal },
            )
          ).items
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
      apiSend<Card>(`/api/cards/${encodeURIComponent(cardId)}`, "PATCH", { frozen }),

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

/**
 * Add a card. The API decides everything else (its own account with a starting balance and payments,
 * name on card, expiry, test number), so the browser only says WHICH card. 409 if they already have it.
 */
export function useAddCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: CardProduct) => apiSend<Card>("/api/cards", "POST", { product }),
    // A new card comes with its own account, money and payments: refresh all three.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cards }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]),
  });
}

/**
 * Add money to one of the customer's accounts. The Idempotency-Key is made ONCE per amount the
 * customer means to add (by the form) and sent again on any retry, so a double tap or a dropped
 * connection can never add the money twice.
 */
export function useAddMoney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, amountPence, idempotencyKey }: { accountId: string; amountPence: number; idempotencyKey: string }) =>
      apiSend<Transaction>(`/api/accounts/${encodeURIComponent(accountId)}/top-ups`, "POST", { amountPence }, {
        "Idempotency-Key": idempotencyKey,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]),
  });
}

// ---------- Paying someone ----------

export function usePayees() {
  return useQuery({ queryKey: queryKeys.payees, queryFn: ({ signal }) => apiFetch<SavedPayee[]>("/api/payees", { signal }) });
}

export function useAddPayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payee: { name: string; type: string; sortCode: string; accountNumber: string }) =>
      apiSend<SavedPayee>("/api/payees", "POST", payee),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payees }),
  });
}

export function usePayments() {
  return useQuery({ queryKey: queryKeys.payments, queryFn: ({ signal }) => apiFetch<Payment[]>("/api/payments", { signal }) });
}

/**
 * Pay a payee. The form makes ONE Idempotency-Key per payment it means to make and sends it again on
 * any retry, so a double tap can never pay twice. The bank screens the payment and answers "settled"
 * (sent) or "held" (paused for a security check).
 */
export function usePay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: { fromAccountId: string; payeeId: string; amountPence: number; reference: string | null; idempotencyKey: string }) =>
      apiSend<Payment>("/api/payments", "POST", body, { "Idempotency-Key": idempotencyKey }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]),
  });
}

// ---------- Risk desk: held payments (staff only) ----------

export function useHeldPayments() {
  return useQuery({
    queryKey: queryKeys.heldPayments,
    queryFn: ({ signal }) => apiFetch<HeldPayment[]>("/api/risk/payments/held", { signal }),
  });
}

/** Release (the money moves) or reject (it never does). A reason is required: it goes in the audit log. */
export function useReviewPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "release" | "reject"; note: string }) =>
      apiSend<HeldPayment>(`/api/risk/payments/${encodeURIComponent(id)}/${action}`, "POST", { note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.heldPayments }),
  });
}
