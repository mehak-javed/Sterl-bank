import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/queries", () => ({
  useHeldPayments: () => ({
    isPending: false,
    isError: false,
    data: [
      {
        id: "p1",
        status: "held",
        amountPence: 150_000,
        riskScore: 55,
        ruleHits: ["LARGE_FOR_THIS_CUSTOMER", "NEW_PAYEE"],
        reviewerNote: "Held with risk score 55. The payment is much larger than usual.",
        createdAt: "2026-11-12T10:00:00Z",
      },
    ],
  }),
  useReviewPayment: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

const { HeldPaymentsQueue } = await import("./HeldPaymentsQueue");

describe("the held payments queue", () => {
  const html = renderToStaticMarkup(<HeldPaymentsQueue />);

  it("shows the amount, the score and the reasons in plain words", () => {
    expect(html).toContain("£1,500.00");
    expect(html).toContain("Risk score 55");
    expect(html).toContain("Unusually large");
    expect(html).toContain("New payee");
    expect(html).not.toContain("LARGE_FOR_THIS_CUSTOMER");
  });

  it("asks for a reason and offers both decisions", () => {
    expect(html).toContain("Reason for your decision");
    expect(html).toContain("Release payment");
    expect(html).toContain("Reject");
  });
});
