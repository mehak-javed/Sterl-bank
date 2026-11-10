import { describe, expect, it } from "vitest";
import { groupByUkDay } from "@/lib/activity";
import type { Transaction } from "@/types/bank";

function tx(id: string, date: string): Transaction {
  return { id, accountId: "a", date, description: id, category: "Groceries", kind: "card", amountPence: -100, balanceAfterPence: 0 };
}

describe("groupByUkDay", () => {
  it("groups by UK calendar day and keeps the order", () => {
    const groups = groupByUkDay([
      tx("c", "2026-10-31T18:00:00.000Z"),
      tx("b", "2026-10-31T08:00:00.000Z"),
      tx("a", "2026-10-30T12:00:00.000Z"),
    ]);

    expect(groups.map((g) => g.label)).toEqual(["Saturday 31 October", "Friday 30 October"]);
    expect(groups[0].transactions.map((t) => t.id)).toEqual(["c", "b"]);
  });

  it("puts a late-night summer payment on the next UK day", () => {
    // 23:30 UTC on 30 September is 00:30 BST on 1 October.
    expect(groupByUkDay([tx("x", "2026-09-30T23:30:00.000Z")])[0].label).toBe("Thursday 1 October");
  });

  it("returns nothing for no transactions", () => {
    expect(groupByUkDay([])).toEqual([]);
  });
});
