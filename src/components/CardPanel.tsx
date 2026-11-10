"use client";

import { Snowflake } from "lucide-react";
import { useCards, useSetCardFrozen } from "@/lib/api/queries";
import { QueryError, SkeletonRows } from "./QueryStates";
import { PaymentCard } from "./ui/PaymentCard";

export function CardPanel() {
  const { data: cards, isPending, isError, error, refetch } = useCards();
  const setFrozen = useSetCardFrozen();
  const card = cards?.[0];

  return (
    <section aria-labelledby="card-heading" aria-busy={isPending} className="rise-in glass flex h-full flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h2 id="card-heading" className="text-lg font-semibold text-heading">
          Your card
        </h2>
        {card && (
          // role="status": screen readers announce the change when the card is (un)frozen.
          <p role="status" className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
            {card.frozen ? "Frozen" : "Active"}
          </p>
        )}
      </div>

      {isPending ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <QueryError message={`We couldn't load your card. ${error.message}`} onRetry={() => refetch()} />
      ) : !card ? (
        <p className="text-sm text-muted">You don&apos;t have a card yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <PaymentCard card={card} />

          <button
            type="button"
            onClick={() => setFrozen.mutate({ cardId: card.id, frozen: !card.frozen })}
            // Disabled while saving: one click = one request, no double-submits.
            disabled={setFrozen.isPending}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold disabled:opacity-50 ${card.frozen ? "btn-primary" : "btn-secondary"}`}
          >
            <Snowflake aria-hidden="true" className="h-4 w-4" />
            {card.frozen ? "Unfreeze card" : "Freeze card"}
          </button>

          {setFrozen.isError && (
            <p role="alert" className="text-sm">
              We couldn&apos;t update your card, so nothing changed. {setFrozen.error.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
