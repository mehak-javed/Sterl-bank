// Rendered to HTML with React's server renderer: no browser (jsdom) needed for these checks.
// (Full component tests with React Testing Library arrive in Week 3.)
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentCard } from "@/components/ui/PaymentCard";
import type { Card } from "@/types/bank";
import { EAGLE_SRC, Eagle } from "./Eagle";
import { Logo } from "./Logo";

const card: Card = {
  id: "card-test",
  accountId: "acc-test",
  brand: "Visa",
  last4: "4242",
  nameOnCard: "TEST NAME",
  expiryMonth: 9,
  expiryYear: 2030,
  frozen: false,
};

describe("the Sterl eagle", () => {
  it("is decoration, hidden from screen readers (the name next to it is what they hear)", () => {
    expect(renderToStaticMarkup(<Eagle />)).toContain('aria-hidden="true"');
  });

  it("uses the card's gold on payment cards", () => {
    expect(renderToStaticMarkup(<Eagle tone="card" />)).toContain("eagle-on-card");
  });
});

describe("the full logo", () => {
  const html = renderToStaticMarkup(<Logo />);

  it("is ONE image called 'Sterl Banking' for screen readers", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Sterl Banking"');
  });

  it("draws the eagle through a stencil from the brand file", () => {
    expect(html).toContain(`href="${EAGLE_SRC}"`);
    expect(html).toMatch(/mask="url\(#[^)]+-eagle\)"/);
  });

  it("gives two logos on one page different gradient and mask ids", () => {
    const two = renderToStaticMarkup(
      <>
        <Logo />
        <Logo />
      </>,
    );
    const ids = [...two.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the payment card", () => {
  const html = renderToStaticMarkup(<PaymentCard card={card} />);

  it("shows the eagle on the card", () => {
    expect(html).toContain("eagle-mark");
  });

  it("still shows only the last 4 digits", () => {
    expect(html).toContain("4242");
    expect(html).not.toMatch(/\d{5,}/);
  });
});
