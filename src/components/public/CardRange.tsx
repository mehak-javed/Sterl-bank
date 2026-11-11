import { PaymentCard } from "@/components/ui/PaymentCard";
import { CARD_PRODUCT_IDS, CARD_PRODUCTS } from "@/lib/cards";
import type { CardProduct } from "@/types/bank";

/** Sample last 4 digits per product, from PUBLISHED test card numbers (never real cards). */
const SAMPLE_LAST4: Record<CardProduct, string> = { debit: "4242", premier: "8210", travel: "4444", virtual: "5556" };

/**
 * "Our cards" on the public site: every card Sterl offers, from the same catalogue
 * (src/lib/cards.ts) the banking app uses, so the two can never disagree.
 * A Server Component: plain HTML, no JavaScript.
 */
export function CardRange() {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {CARD_PRODUCT_IDS.map((id) => {
        const product = CARD_PRODUCTS[id];
        return (
          <li key={id} className="panel flex flex-col gap-4 rounded-3xl p-5">
            <PaymentCard
              card={{
                product: id,
                brand: product.network,
                nameOnCard: "Your name",
                last4: SAMPLE_LAST4[id],
                expiryMonth: 9,
                expiryYear: 2030,
                frozen: false,
              }}
            />
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="eyebrow mt-1 text-muted">{product.network}</p>
              <p className="mt-2 text-sm text-muted">{product.summary}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
