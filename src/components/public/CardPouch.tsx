import type { CSSProperties } from "react";
import { Eagle } from "@/components/brand/Eagle";
import { PaymentCard } from "@/components/ui/PaymentCard";
import { CARD_PRODUCTS } from "@/lib/cards";
import type { Card, CardProduct } from "@/types/bank";

type SampleCard = Omit<Card, "id" | "accountId">;

/** Sample last 4 digits per product, from PUBLISHED test card numbers (never real cards). */
const SAMPLE_LAST4: Record<CardProduct, string> = { debit: "4242", premier: "8210", travel: "4444", virtual: "5556" };

const sample = (product: CardProduct): SampleCard => ({
  product,
  brand: CARD_PRODUCTS[product].network,
  nameOnCard: "Your name",
  last4: SAMPLE_LAST4[product],
  expiryMonth: 9,
  expiryYear: 2030,
  frozen: false,
});

/**
 * The cards in the pouch, back to front. Each one rests peeking out of the pouch at its own fan
 * angle, then takes its turn to slide right out, show itself, and slide back in.
 *   fan: its angle while it rests. shift: how far left/right it sits (%), so the fan spreads out.
 *   delay: when its turn comes (negative = already part-way through
 *   the cycle when the page opens, so the four take turns one after another).
 */
const POUCH: { product: CardProduct; fan: number; shift: number; delay: number }[] = [
  { product: "premier", fan: -13, shift: -7, delay: 0 },
  { product: "travel", fan: -5, shift: -2.5, delay: -12 },
  { product: "virtual", fan: 4, shift: 2.5, delay: -8 },
  { product: "debit", fan: 12, shift: 7, delay: -4 },
];

/**
 * A black-and-gold metal card pouch for the landing page, holding all four Sterl cards. One at a
 * time, each card slides up out of the pouch, holds for a moment so you can see it, and slides back
 * in, so the animation shows every card the bank offers. The whole pouch floats gently, tilted in 3D.
 *
 * How the "inside the pouch" effect works: three flat layers inside one tilted scene. The pouch's
 * BACK panel is drawn first, the cards next, the pouch's FRONT panel last. So a card lower than the
 * front panel's top edge is hidden behind it (in the pouch), and a card that slides up appears.
 *
 * Pure CSS (the card-pouch classes in globals.css): runs on the browser's compositor, no JavaScript,
 * no animation library. Speed and angles are CSS variables; see the comments there. Still (all
 * four cards peeking out in a fan) for people who asked their device for less motion.
 *
 * role="img" with one description: a screen reader hears one sentence, not four cards of text.
 */
export function CardPouch() {
  return (
    <div
      role="img"
      aria-label="A black and gold Sterl card pouch. The Premier Metal, Travel, Virtual and Everyday Debit cards take turns sliding out of it and back in."
      className="card-pouch"
    >
      <span className="card-pouch-floor" />
      <div className="card-pouch-scene">
        {/* 1. The pouch's back panel (behind the cards). */}
        <div className="card-pouch-back" />

        {/* 2. The cards. */}
        {POUCH.map(({ product, fan, shift, delay }) => (
          <div
            key={product}
            className="card-pouch-card"
            style={{ "--fan": `${fan}deg`, "--shift": `${shift}%`, "--delay": `${delay}s` } as CSSProperties}
          >
            <PaymentCard card={sample(product)} />
          </div>
        ))}

        {/* 3. The pouch's front panel (in front of the cards): metal, a gold strap, the eagle. */}
        <div className="card-pouch-front">
          <span className="card-pouch-strap" />
          <span className="card-pouch-brand">
            <Eagle className="h-[2.4em]" />
            <span>STERL</span>
          </span>
        </div>
      </div>
    </div>
  );
}
