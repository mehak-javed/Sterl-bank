"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAddCard, useCards } from "@/lib/api/queries";
import { CARD_PRODUCTS } from "@/lib/cards";
import type { CardProduct } from "@/types/bank";
import { Sheet } from "./shell/Sheet";

const PRODUCTS = Object.entries(CARD_PRODUCTS) as [CardProduct, (typeof CARD_PRODUCTS)[CardProduct]][];

/**
 * "+ Add a card": choose one of Sterl's cards. The API gives it its own account, opened with a
 * starting balance and recent payments, and saves it all in PostgreSQL (name and number encrypted). Cards the customer already has are shown
 * but can't be chosen again (the API would answer 409 anyway).
 */
export function AddCard({ label = "Add a card", triggerClassName }: { label?: string; triggerClassName?: string }) {
  const router = useRouter();
  const { data: cards } = useCards();
  const addCard = useAddCard();
  const owned = new Set(cards?.map((c) => c.product));

  return (
    <Sheet
      title="Add a card"
      trigger={
        <>
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {label}
        </>
      }
      triggerClassName={
        triggerClassName ??
        "flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold whitespace-nowrap hover:border-accent"
      }
    >
      {(close) => (
        <>
          <ul className="flex flex-col gap-2">
            {PRODUCTS.map(([product, info]) => {
              const have = owned.has(product);
              return (
                <li key={product}>
                  <button
                    type="button"
                    disabled={have || addCard.isPending}
                    onClick={() =>
                      addCard.mutate(product, {
                        onSuccess: () => {
                          close();
                          router.refresh(); // the new card's account appears in the balance and account list
                        },
                      })
                    }
                    className="flex w-full items-center gap-4 rounded-2xl border border-line p-3 text-left hover:border-accent disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {/* A small swatch of the card's design: decoration, the words say which card. */}
                    <span aria-hidden="true" className={`card-design-${info.design} h-10 w-16 shrink-0 rounded-md`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{info.name}</span>
                      <span className="block text-sm text-muted">{have ? "You already have this card" : info.summary}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted">{info.network}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {addCard.isPending && <p role="status" className="text-sm text-muted">Adding your card…</p>}
          {addCard.isError && (
            <p role="alert" className="text-sm">
              We couldn&apos;t add that card. {addCard.error.message}
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}
