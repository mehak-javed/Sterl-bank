import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The cards a customer already has, as the API would report them.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/api/queries", () => ({
  useCards: () => ({ data: [{ id: "c1", product: "debit" }] }),
  useAddCard: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

const { AddCard } = await import("./AddCard");

describe("Add a card", () => {
  const html = renderToStaticMarkup(<AddCard />);

  it("offers every Sterl card", () => {
    for (const name of ["Everyday Debit", "Premier Metal", "Travel Card", "Virtual Card"]) expect(html).toContain(name);
  });

  it("won't offer a card the customer already has", () => {
    const debit = html.slice(html.indexOf("<button", html.indexOf("<ul")), html.indexOf("Everyday Debit"));
    expect(debit).toContain("disabled");
    expect(html).toContain("You already have this card");
    expect(html.match(/You already have this card/g)).toHaveLength(1);
  });

  it("asks only which card: no card number, PIN or account fields", () => {
    expect(html).not.toMatch(/<input|<select|<textarea/);
  });
});
