import type { Card, CardProduct } from "@/types/bank";

/** How a card looks. Each design is a utility in globals.css (card-design-*). */
export type CardDesign = "black" | "gold" | "jolly" | "black-gold";

export type CardProductInfo = {
  name: string;
  /** The word printed on the card's top-right corner. */
  label: string;
  design: CardDesign;
  network: Card["brand"];
  /** One line for the public "Our cards" section. */
  summary: string;
};

/**
 * Every card Sterl offers, in the order they're shown. The PRODUCT decides the design and network,
 * so data can never hold an impossible combination like a gold Virtual Card.
 * (Visa and Mastercard are shown only as plain words: no network logos are copied.)
 */
export const CARD_PRODUCTS: Record<CardProduct, CardProductInfo> = {
  debit: {
    name: "Everyday Debit",
    label: "Debit",
    design: "black",
    network: "Visa",
    summary: "Your main card: spend from your Everyday Account and round every payment up.",
  },
  premier: {
    name: "Premier Metal",
    label: "Premier",
    design: "gold",
    network: "Mastercard",
    summary: "Solid gold finish, airport lounges and higher limits for your biggest plans.",
  },
  travel: {
    name: "Travel Card",
    label: "Travel",
    design: "black-gold",
    network: "Mastercard",
    summary: "No fees abroad and live exchange rates, in black with a band of gold.",
  },
  virtual: {
    name: "Virtual Card",
    label: "Virtual",
    design: "jolly",
    network: "Visa",
    summary: "A separate number for online shopping, in bright colours. Freeze or bin it any time.",
  },
};

/** The products in display order. */
export const CARD_PRODUCT_IDS = Object.keys(CARD_PRODUCTS) as CardProduct[];

/**
 * Which card of a slideshow is centred, from how far it has been scrolled.
 * `step` is the distance from one card to the next (card width + gap). Rounds to the nearest card
 * and never goes outside 0..count-1 (a fast swipe can overshoot, and Safari "bounces" past the ends).
 */
export function slideIndexAt(scrollLeft: number, step: number, count: number): number {
  if (count <= 0 || step <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}

/** "Travel Card ending 4444": how a card is named for screen readers and buttons. */
export function cardTitle(card: Pick<Card, "product" | "last4">): string {
  return `${CARD_PRODUCTS[card.product].name} ending ${card.last4}`;
}
