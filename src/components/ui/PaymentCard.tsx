import { Snowflake } from "lucide-react";
import type { Card } from "@/types/bank";

/**
 * A picture of the customer's card, in the proportions of a real bank card (85.6 × 54 mm).
 * Only the last 4 digits, ever: the full number (a published TEST number) is never sent to the page.
 * The details are real text (not part of an image), so screen readers can read them.
 */
export function PaymentCard({ card }: { card: Card }) {
  const expiry = `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`;

  return (
    <div className="relative aspect-[85.6/54] w-full max-w-sm overflow-hidden rounded-2xl payment-card p-5">
      {/* A soft gold sheen in the corner: decoration only. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-card-accent/15 blur-2xl" />

      <div className={`relative flex h-full flex-col justify-between ${card.frozen ? "opacity-45" : ""}`}>
        <div className="flex items-start justify-between">
          <span className="text-lg font-bold tracking-[0.06em] text-card-accent" style={{ fontFamily: "var(--font-display), serif" }}>
            STERL
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] text-card-foreground/80 uppercase">Debit</span>
        </div>

        {/* The chip: a gold rounded rectangle. */}
        <span aria-hidden="true" className="block h-8 w-11 rounded-md bg-gradient-to-br from-card-accent to-card-accent/50" />

        <div>
          <p className="font-mono text-base tracking-[0.18em] sm:text-lg">
            <span aria-hidden="true">•••• •••• •••• </span>
            <span className="sr-only">Card ending </span>
            {card.last4}
          </p>
          <div className="mt-2 flex items-end justify-between text-xs">
            <span className="font-medium tracking-wide uppercase">{card.nameOnCard}</span>
            <span className="tabular-nums">
              <span className="sr-only">Expires </span>
              {expiry}
            </span>
          </div>
        </div>
      </div>

      {card.frozen && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
            <Snowflake aria-hidden="true" className="h-4 w-4" /> Frozen
          </span>
        </div>
      )}
    </div>
  );
}
