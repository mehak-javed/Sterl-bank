"use client";

import { useCards, useSetCardFrozen } from "@/lib/api/queries";
import { QueryError, SkeletonRows } from "./QueryStates";

export function CardPanel() {
  const { data: cards, isPending, isError, error, refetch } = useCards();
  const setFrozen = useSetCardFrozen();
  const card = cards?.[0];

  return (
    <section aria-labelledby="card-heading" aria-busy={isPending} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h2 id="card-heading" className="mb-3 text-lg font-semibold">
        Your card
      </h2>

      {isPending ? (
        <SkeletonRows rows={2} />
      ) : isError ? (
        <QueryError message={`We couldn't load your card. ${error.message}`} onRetry={() => refetch()} />
      ) : !card ? (
        <p className="text-sm opacity-70">You don&apos;t have a card yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={`rounded-xl border-l-4 border-accent bg-background p-4 ${card.frozen ? "opacity-60" : ""}`}>
            <p className="font-mono tracking-widest">•••• •••• •••• {card.last4}</p>
            <p className="mt-2 flex justify-between text-sm">
              <span>{card.nameOnCard}</span>
              <span>
                {String(card.expiryMonth).padStart(2, "0")}/{String(card.expiryYear).slice(-2)}
              </span>
            </p>
          </div>

          {/* role="status": screen readers announce the change when the card is (un)frozen. */}
          <p role="status" className="text-sm">
            Status: <strong>{card.frozen ? "Frozen" : "Active"}</strong>
          </p>

          <button
            type="button"
            onClick={() => setFrozen.mutate({ cardId: card.id, frozen: !card.frozen })}
            // Disabled while saving: one click = one request, no double-submits.
            disabled={setFrozen.isPending}
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
          >
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
