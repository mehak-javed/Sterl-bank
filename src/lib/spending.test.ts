import { describe, expect, it } from "vitest";
import { latestMonth, latestSpendingMonth, monthLabel, summariseSpending, ukMonthOf } from "@/lib/spending";
import type { Transaction } from "@/types/bank";

let id = 0;
function tx(overrides: Partial<Transaction>): Transaction {
  id += 1;
  return {
    id: `t${id}`,
    accountId: "a1",
    date: "2026-10-15T12:00:00.000Z",
    description: "Test",
    category: "Groceries",
    kind: "card",
    amountPence: -1000,
    balanceAfterPence: 0,
    ...overrides,
  };
}

describe("ukMonthOf", () => {
  it("uses UK time, so late on 30 September UTC can already be October", () => {
    expect(ukMonthOf("2026-09-30T23:30:00.000Z")).toBe("2026-10"); // 00:30 BST on 1 October
    expect(ukMonthOf("2026-09-30T22:30:00.000Z")).toBe("2026-09"); // 23:30 BST on 30 September
  });
});

describe("summariseSpending", () => {
  it("adds up spending per category, biggest first, as whole pence", () => {
    const result = summariseSpending(
      [
        tx({ category: "Groceries", amountPence: -1234 }),
        tx({ category: "Groceries", amountPence: -766 }),
        tx({ category: "Transport", amountPence: -500 }),
        tx({ category: "Bills", kind: "direct_debit", amountPence: -3000 }),
      ],
      "2026-10",
    );

    expect(result.totalPence).toBe(5500);
    expect(result.categories.map((c) => [c.category, c.pence])).toEqual([
      ["Bills", 3000],
      ["Groceries", 2000],
      ["Transport", 500],
    ]);
    expect(result.categories[0].share).toBeCloseTo(3000 / 5500);
  });

  it("leaves out transfers, round-ups and refunds: that money isn't spent", () => {
    const result = summariseSpending(
      [
        tx({ amountPence: -1000 }),
        tx({ kind: "transfer", category: "Savings", amountPence: -50000 }),
        tx({ kind: "roundup", category: "Round-ups", amountPence: -53 }),
        tx({ amountPence: 400 }), // a refund
        tx({ kind: "salary", category: "Income", amountPence: 340000 }),
      ],
      "2026-10",
    );

    expect(result.totalPence).toBe(1000);
    expect(result.categories).toHaveLength(1);
  });

  it("only counts the month asked for", () => {
    const result = summariseSpending(
      [tx({ date: "2026-10-31T10:00:00.000Z" }), tx({ date: "2026-11-01T10:00:00.000Z" })],
      "2026-10",
    );
    expect(result.totalPence).toBe(1000);
  });

  it("returns an empty month without dividing by zero", () => {
    expect(summariseSpending([], "2026-10")).toEqual({ month: "2026-10", totalPence: 0, categories: [] });
  });
});

describe("latestMonth and monthLabel", () => {
  it("finds the most recent month with any transaction", () => {
    expect(latestMonth([tx({ date: "2026-08-03T10:00:00Z" }), tx({ date: "2026-10-31T10:00:00Z" })])).toBe("2026-10");
    expect(latestMonth([])).toBeNull();
  });

  it("picks the latest month with SPENDING, not just any transaction", () => {
    // Found while checking the redesign: a transfer on 5 November made the summary show an empty November.
    const transactions = [
      tx({ date: "2026-11-05T10:00:00Z", kind: "transfer", category: "Savings", amountPence: -5000 }),
      tx({ date: "2026-10-31T10:00:00Z" }),
    ];
    expect(latestMonth(transactions)).toBe("2026-11");
    expect(latestSpendingMonth(transactions)).toBe("2026-10");
  });

  it("names a month for people", () => {
    expect(monthLabel("2026-10")).toBe("October 2026");
  });
});
