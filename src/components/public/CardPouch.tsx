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
 * The cards in the pouch, back to front, each resting at its own fan angle and sideways spread.
 *   fan: its angle while it rests. shift: how far left/right it sits (%), so the fan spreads out.
 *   Kept small (±8°, ±4%): at -13° and -7% the gold card's top corner hung outside the pouch.
 * They leave and return one after another: card i starts i × 0.15s after the one before it.
 * (Written as (i × 15) / 100: in floating point, 3 × 0.15 is 0.44999999999999996, not 0.45.)
 */
const POUCH: { product: CardProduct; fan: number; shift: number }[] = [
  { product: "premier", fan: -8, shift: -4 },
  { product: "travel", fan: -3, shift: -1.5 },
  { product: "virtual", fan: 3, shift: 1.5 },
  { product: "debit", fan: 8, shift: 4 },
];

/**
 * A black-and-gold metal card pouch for the landing page, holding all four Sterl cards, on a loop:
 *   open, cards fanned → the cards fly up out of the pouch and off the screen → the flap closes →
 *   the flap opens → the cards drop back into the pouch → the flap closes over them → it opens again.
 * The whole pouch floats gently, tilted in 3D.
 *
 * One shared clock: the cards and the flap all use the same cycle length (--pouch-cycle), and each
 * keyframe list says WHEN in that cycle things happen, so they stay in sync forever.
 *
 * How the "inside the pouch" effect works: flat layers inside one tilted scene, painted in order:
 * BACK panel, the cards, the FRONT panel, then the FLAP. A card below the front panel's top edge is
 * hidden behind it (in the pouch); the closed flap covers the opening and the tops of the cards.
 *
 * Pure CSS (the card-pouch classes in globals.css): runs on the browser's compositor, no JavaScript,
 * no animation library. Timing and angles are CSS variables; see the comments there. Still (open,
 * cards fanned) for people who asked their device for less motion.
 *
 * role="img" with one description: a screen reader hears one sentence, not four cards of text.
 */
export function CardPouch() {
  return (
    <div
      role="img"
      aria-label="A black and gold Sterl card pouch holding the Premier Metal, Travel, Virtual and Everyday Debit cards. The cards fly out, the pouch closes and opens, and the cards drop back in."
      className="card-pouch"
    >
      <span className="card-pouch-floor" />
      <div className="card-pouch-scene">
        {/* 1. The pouch's back panel (behind the cards). */}
        <div className="card-pouch-back" />

        {/* 2. The cards. */}
        {POUCH.map(({ product, fan, shift }, i) => (
          <div
            key={product}
            className="card-pouch-card"
            style={{ "--fan": `${fan}deg`, "--shift": `${shift}%`, "--stagger": `${(i * 15) / 100}s` } as CSSProperties}
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

        {/* 4. The flap: folds down over the opening to close the pouch, with a gold clasp. */}
        <div className="card-pouch-flap">
          <span className="card-pouch-clasp" />
        </div>
      </div>
    </div>
  );
}
