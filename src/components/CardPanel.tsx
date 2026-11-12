"use client";

import { useRef, useState } from "react";
import { Snowflake } from "lucide-react";
import { useAccounts, useCards, useSetCardFrozen, useTransactions } from "@/lib/api/queries";
import { formatGBP } from "@/lib/money";
import { AddCard } from "./AddCard";
import { cardTitle, slideIndexAt } from "@/lib/cards";
import { QueryError, SkeletonRows } from "./QueryStates";
import { CategoryIcon } from "./ui/CategoryIcon";
import { Money } from "./ui/Money";
import { PaymentCard } from "./ui/PaymentCard";

/**
 * The customer's card wallet: a side-by-side slideshow. Swipe it by hand: a finger on a phone, two
 * fingers on a trackpad, or click-and-drag with a mouse. The card in the centre is the chosen one, and
 * Freeze / unfreeze acts on it. No dots or arrows on screen (Mehak's design); the peeking edges of
 * the neighbouring cards show there are more. Keyboard users focus the strip and use ← →.
 *
 * Built on CSS scroll-snap rather than a carousel library: the browser does the swiping, momentum
 * and "snap to the nearest card" itself, on touch, trackpad, mouse wheel and keyboard alike.
 * Our code only reads WHICH card is centred (onScroll), scrolls to one (← →), and adds mouse drag.
 */
export function CardPanel() {
  const { data: cards, isPending, isError, error, refetch } = useCards();
  const { data: accounts } = useAccounts();
  const setFrozen = useSetCardFrozen();
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLUListElement>(null);
  // Where a key press is taking us. While the smooth scroll runs, the strip passes other cards;
  // without this, a second quick click would count from a card we're only passing (found by testing:
  // two clicks on "Next" went to card 2, not 3).
  const targetRef = useRef<number | null>(null);
  // Mouse drag: where the drag started. (Fingers and trackpads swipe natively; a mouse can't, so
  // click-and-drag is added for it.)
  const dragRef = useRef<{ x: number; left: number } | null>(null);

  const count = cards?.length ?? 0;
  const current = Math.min(index, Math.max(count - 1, 0));
  const card = cards?.[current];
  // A card spends from an account: a newly added card has its own (e.g. "Travel Card"), so show its balance.
  const spendsFrom = accounts?.find((a) => a.id === card?.accountId);

  /** Scrolls so that card i sits in the centre (smoothly, unless the device asked for less motion). */
  function goTo(i: number) {
    const scroller = scrollerRef.current;
    const slide = scroller?.children[i] as HTMLElement | undefined;
    if (!scroller || !slide) return;
    targetRef.current = i;
    setIndex(i);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left: slide.offsetLeft - (scroller.clientWidth - slide.clientWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  /** The card nearest the centre right now. */
  function centredIndex(scroller: HTMLElement) {
    const first = scroller.children[0] as HTMLElement | undefined;
    const second = scroller.children[1] as HTMLElement | undefined;
    if (!first) return 0;
    // One "step" = the distance from one card to the next (card width + gap).
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    return slideIndexAt(scroller.scrollLeft, step, count);
  }

  // ---- Mouse drag-to-swipe ----
  // Snapping is switched off while dragging (otherwise the browser fights every pixel we move), then
  // switched back on and the nearest card is centred when the mouse is let go.
  function onPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    targetRef.current = null; // a hand takes over from any key-driven scroll
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragRef.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
    e.currentTarget.style.scrollSnapType = "none";
    e.currentTarget.setPointerCapture(e.pointerId); // keep getting moves even off the strip
  }
  function onPointerMove(e: React.PointerEvent<HTMLUListElement>) {
    if (!dragRef.current) return;
    e.currentTarget.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x);
  }
  function onPointerUp(e: React.PointerEvent<HTMLUListElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    e.currentTarget.style.scrollSnapType = "";
    goTo(centredIndex(e.currentTarget));
  }

  /** While swiping, work out which card is nearest the centre. */
  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || dragRef.current) return; // mid-drag: decide on release
    const centred = centredIndex(scroller);
    if (targetRef.current !== null) {
      // Moving because of a key press: keep showing the destination until we arrive.
      if (centred === targetRef.current) targetRef.current = null;
      return;
    }
    setIndex(centred);
  }

  return (
    <section aria-labelledby="card-heading" aria-busy={isPending} className="rise-in glass flex h-full min-w-0 flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="card-heading" className="text-lg font-semibold text-heading">
          {count > 1 ? `Your cards (${count})` : "Your card"}
        </h2>
        <div className="flex items-center gap-2">
          {card && (
            // role="status": screen readers announce the change when the card is (un)frozen.
            <p role="status" className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
              {card.frozen ? "Frozen" : "Active"}
            </p>
          )}
          {card && <AddCard label="Add" />}
        </div>
      </div>

      {isPending ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <QueryError message={`We couldn't load your cards. ${error.message}`} onRetry={() => refetch()} />
      ) : !card || !cards ? (
        // A new customer: no cards yet, so the way to add one is the main thing here.
        <div className="flex flex-1 flex-col items-start justify-center gap-4 rounded-2xl border border-dashed border-line p-6">
          <div>
            <p className="font-semibold">No cards yet</p>
            <p className="mt-1 text-sm text-muted">Add a debit, travel, premier or virtual card. Each one comes with its own balance.</p>
          </div>
          <AddCard triggerClassName="flex items-center gap-2 rounded-full btn-primary px-5 py-2.5 text-sm font-semibold" />
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          {/* aria-roledescription: screen readers say "carousel" and "slide" instead of "list". */}
          <div aria-roledescription="carousel" aria-label="Your cards" className="relative min-w-0">
            <ul
              ref={scrollerRef}
              onScroll={onScroll}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              // A trackpad swipe takes over from any key-driven scroll still in progress.
              onWheel={() => (targetRef.current = null)}
              // Keyboard: with the strip focused, ← and → move one card (no buttons on screen).
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault(); // we move a whole card, not the browser's few pixels
                const from = targetRef.current ?? current;
                goTo(Math.min(count - 1, Math.max(0, from + (e.key === "ArrowRight" ? 1 : -1))));
              }}
              // snap-x snap-mandatory: when a swipe ends, the browser always settles on one card.
              // px-[5%] / sm:px-[8%]: room either side, so the first and last cards can sit in the centre too.
              // tabIndex 0: keyboard users can focus the strip and move with the arrow keys.
              tabIndex={0}
              className="flex cursor-grab snap-x snap-mandatory gap-3 select-none active:cursor-grabbing overflow-x-auto overscroll-x-contain rounded-2xl px-[5%] py-2 sm:px-[8%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {cards.map((c, i) => (
                <li
                  key={c.id}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}: ${cardTitle(c)}${c.frozen ? ", frozen" : ""}`}
                  // The centred card is full size; its neighbours are a little smaller and dimmer,
                  // so it's clear which one the Freeze button will act on.
                  className={`w-[90%] shrink-0 snap-center sm:w-[84%] transition duration-300 ${i === current ? "" : "scale-90 opacity-60"}`}
                >
                  <PaymentCard card={c} />
                </li>
              ))}
            </ul>

          </div>

          {spendsFrom && (
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted">{spendsFrom.name}</p>
              <p className="text-2xl font-semibold tracking-tight">
                <Money pence={spendsFrom.balancePence} />
              </p>
            </div>
          )}
          {card && <CardActivity accountId={card.accountId} />}

          <button
            type="button"
            onClick={() => setFrozen.mutate({ cardId: card.id, frozen: !card.frozen })}
            // Disabled while saving: one click = one request, no double-submits.
            disabled={setFrozen.isPending}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold disabled:opacity-50 ${card.frozen ? "btn-primary" : "btn-secondary"}`}
          >
            <Snowflake aria-hidden="true" className="h-4 w-4" />
            {card.frozen ? "Unfreeze" : "Freeze"} {cardTitle(card)}
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

/** The latest payments on the centred card's account: each card has its own. */
function CardActivity({ accountId }: { accountId: string }) {
  const { data: transactions, isPending } = useTransactions(accountId, 3);
  if (isPending) return <SkeletonRows rows={2} />;
  if (!transactions || transactions.length === 0) return null;
  return (
    <ul aria-label="Latest payments on this card" className="flex flex-col">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-1.5 text-sm">
          <CategoryIcon category={t.category} className="h-8 w-8" />
          <span className="min-w-0 flex-1 truncate font-medium">{t.description}</span>
          <span className={`tabular-nums font-semibold ${t.amountPence > 0 ? "text-positive" : ""}`}>
            {t.amountPence > 0 ? "+" : ""}
            {formatGBP(t.amountPence)}
          </span>
        </li>
      ))}
    </ul>
  );
}
