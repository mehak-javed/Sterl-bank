import { describe, expect, it } from "vitest";
import cards from "@/mocks/data/cards.json";
import type { Card } from "@/types/bank";
import { CARD_PRODUCT_IDS, CARD_PRODUCTS, cardTitle, slideIndexAt } from "./cards";

const fixtureCards = cards as Card[];

describe("slideIndexAt (which card is centred)", () => {
  it("is the first card before any swipe", () => {
    expect(slideIndexAt(0, 300, 4)).toBe(0);
  });

  it("is the card a whole number of steps along", () => {
    expect(slideIndexAt(600, 300, 4)).toBe(2);
  });

  it("rounds to the nearest card mid-swipe", () => {
    expect(slideIndexAt(140, 300, 4)).toBe(0);
    expect(slideIndexAt(160, 300, 4)).toBe(1);
  });

  it("never goes past the last card or before the first (overshoot, bounce)", () => {
    expect(slideIndexAt(5000, 300, 4)).toBe(3);
    expect(slideIndexAt(-40, 300, 4)).toBe(0);
  });

  it("copes with no cards and a zero-width step (before layout)", () => {
    expect(slideIndexAt(100, 300, 0)).toBe(0);
    expect(slideIndexAt(100, 0, 4)).toBe(0);
  });
});

describe("the card catalogue", () => {
  it("offers four products, each with its own design", () => {
    const designs = CARD_PRODUCT_IDS.map((id) => CARD_PRODUCTS[id].design);
    expect(new Set(designs)).toEqual(new Set(["black", "gold", "jolly", "black-gold"]));
  });

  it("names a card for screen readers", () => {
    expect(cardTitle({ product: "travel", last4: "4444" })).toBe("Travel Card ending 4444");
  });
});

describe("the fake customer's cards (fixtures)", () => {
  // Last 4 digits of PUBLISHED test card numbers only.
  const PUBLISHED_TEST_LAST4 = new Set(["4242", "5556", "4444", "8210"]);

  it("has one card of every product", () => {
    expect(fixtureCards.map((c) => c.product).sort()).toEqual([...CARD_PRODUCT_IDS].sort());
  });

  it("prints the network each product uses", () => {
    for (const card of fixtureCards) expect(card.brand).toBe(CARD_PRODUCTS[card.product].network);
  });

  it("uses only published test card numbers", () => {
    for (const card of fixtureCards) expect(PUBLISHED_TEST_LAST4.has(card.last4)).toBe(true);
  });

  it("keeps the original debit card first, with the same id as before", () => {
    expect(fixtureCards[0]).toMatchObject({ id: "b0422f68-b03d-4d55-8c41-4607b817b005", product: "debit" });
  });
});
