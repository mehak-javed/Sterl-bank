import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/queries", () => ({
  useAccounts: () => ({ data: [{ id: "a1", type: "current", name: "Everyday Account", balancePence: 25_000 }] }),
  usePayees: () => ({ isPending: false, isError: false, data: [] }),
  usePay: () => ({ mutate: vi.fn(), isPending: false }),
  usePayments: () => ({ isPending: false, isError: false, data: [] }),
  useAddPayee: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

const { PaySomeone } = await import("./PaySomeone");

describe("Pay someone, for a new customer", () => {
  const html = renderToStaticMarkup(<PaySomeone />);

  it("explains there's nobody to pay yet and offers to add a payee", () => {
    expect(html).toContain("You haven&#x27;t saved anyone to pay yet");
    expect(html).toContain("New payee");
    expect(html).toContain("No payments yet.");
  });

  it("asks nothing truly private: the payee form only wants name, sort code and account number", () => {
    expect(html).not.toMatch(/passport|date of birth|national insurance/i);
  });
});
