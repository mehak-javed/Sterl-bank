import { Snowflake } from "lucide-react";
import { Eagle } from "@/components/brand/Eagle";
import { CARD_PRODUCTS, type CardDesign } from "@/lib/cards";
import type { Card } from "@/types/bank";

/**
 * Full class names, written out: Tailwind only generates classes it can see whole in the source,
 * so a built-up name like `card-design-${design}` would silently get no styles.
 */
const DESIGN_CLASS: Record<CardDesign, string> = {
  black: "card-design-black",
  gold: "card-design-gold",
  "black-gold": "card-design-black-gold",
  jolly: "card-design-jolly",
};

/**
 * A picture of a card, in the proportions of a real bank card (85.6 × 54 mm).
 * Its product decides the design (black, gold, black-gold or jolly colours), the word in the corner
 * and the network. Only the last 4 digits, ever: the full number (a published TEST number) is never
 * sent to the page. The details are real text (not part of an image), so screen readers can read them.
 */
export function PaymentCard({ card }: { card: Omit<Card, "id" | "accountId"> }) {
  const product = CARD_PRODUCTS[card.product];
  const expiry = `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`;

  return (
    // @container: every size inside is in cqw (1cqw = 1% of THIS card's width), so the card scales
    // like a picture: the same layout on a 260px phone slide and a 384px desktop card.
    <div
      className={`@container relative aspect-[85.6/54] w-full max-w-sm overflow-hidden rounded-2xl payment-card ${DESIGN_CLASS[product.design]}`}
    >
      {/* A soft sheen in the corner: decoration only. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

      <div className={`absolute inset-0 flex flex-col justify-between p-[6cqw] ${card.frozen ? "opacity-45" : ""}`}>
        <div className="flex items-start justify-between">
          <span
            className="text-[5.8cqw] leading-none font-bold tracking-[0.06em] text-[var(--card-wordmark,var(--card-accent))]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            STERL
          </span>
          <span className="text-[3.3cqw] leading-none font-semibold tracking-[0.2em] uppercase opacity-85">{product.label}</span>
        </div>

        {/* The middle row: the chip on the left, the Sterl eagle filling the empty right side. */}
        <div className="flex items-center justify-between">
          <span aria-hidden="true" className="block h-[8.5cqw] w-[11.5cqw] rounded-[1.6cqw] bg-gradient-to-br from-card-accent to-card-accent/50" />
          {/* 18cqw = 18% of THIS card's width (a container query), so it fits small and large cards alike. */}
          <Eagle tone="card" className="h-[18cqw]" />
        </div>

        <div>
          <p className="font-mono text-[5cqw] leading-none tracking-[0.16em] whitespace-nowrap">
            <span aria-hidden="true">•••• •••• •••• </span>
            <span className="sr-only">Card ending </span>
            {card.last4}
          </p>
          <div className="mt-[2.5cqw] flex items-end justify-between gap-[3cqw] text-[3.3cqw] leading-tight">
            <span className="min-w-0">
              <span className="block truncate font-medium tracking-wide uppercase">{card.nameOnCard}</span>
              <span className="tabular-nums">
                <span className="sr-only">Expires </span>
                {expiry}
              </span>
            </span>
            {/* The network as a plain word: no Visa or Mastercard logo is copied. */}
            <span className={card.brand === "Visa" ? "text-[6cqw] leading-none font-black tracking-tight italic" : "text-[3.8cqw] leading-none font-bold"}>
              {card.brand === "Visa" ? "VISA" : "Mastercard"}
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
