import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CardPouch } from "./CardPouch";

describe("the landing page's card pouch", () => {
  const html = renderToStaticMarkup(<CardPouch />);

  it("is one described picture for screen readers, not four cards of text read aloud", () => {
    expect(html).toContain('role="img"');
    expect(html).toMatch(/aria-label="[^"]*pouch[^"]*"/);
  });

  it("holds all four cards", () => {
    for (const design of ["card-design-gold", "card-design-black-gold", "card-design-jolly", 'card-design-black"'])
      expect(html).toContain(design);
  });

  it("draws the back panel, then the cards, then the front panel (that order hides cards in the pouch)", () => {
    const back = html.indexOf("card-pouch-back");
    const firstCard = html.indexOf("card-pouch-card");
    const lastCard = html.lastIndexOf("card-pouch-card");
    const front = html.indexOf("card-pouch-front");
    expect(back).toBeLessThan(firstCard);
    expect(lastCard).toBeLessThan(front);
  });

  it("gives the four cards turns a quarter-cycle apart", () => {
    const delays = [...html.matchAll(/--delay:(-?\d+)s/g)].map((m) => Number(m[1]));
    expect(delays.map((d) => ((d % 16) + 16) % 16).sort((a, b) => a - b)).toEqual([0, 4, 8, 12]);
  });

  it("shows only published test card numbers", () => {
    for (const last4 of ["8210", "4444", "5556", "4242"]) expect(html).toContain(last4);
    expect(html).not.toMatch(/\d{5,}/);
  });
});
