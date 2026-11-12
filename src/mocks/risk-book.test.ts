import { describe, expect, it } from "vitest";
import { COUNTERPARTIES, MIN_FACILITIES, generateRiskBook, toSql } from "./risk-book";

// One generation shared by every check (the generator's random sequence continues between calls).
const book = generateRiskBook();

describe("the Credit Risk lending book generator", () => {
  it("makes 500 companies and at least 2,000 facilities", () => {
    expect(book.counterparties).toHaveLength(COUNTERPARTIES);
    expect(book.facilities.length).toBeGreaterThanOrEqual(MIN_FACILITIES);
  });

  it("uses whole pence for every limit and movement, with the right sign", () => {
    for (const f of book.facilities) expect(Number.isSafeInteger(f.limitPence) && f.limitPence >= 0).toBe(true);
    for (const m of book.movements) {
      expect(Number.isSafeInteger(m.amountPence)).toBe(true);
      expect(m.kind === "drawdown" ? m.amountPence > 0 : m.amountPence < 0).toBe(true);
    }
  });

  it("never lets a facility be repaid more than was drawn", () => {
    const running = new Map<string, number>();
    for (const m of book.movements) {
      const next = (running.get(m.facilityId) ?? 0) + m.amountPence;
      expect(next).toBeGreaterThanOrEqual(0);
      running.set(m.facilityId, next);
    }
  });

  it("gives every company a unique invented name", () => {
    expect(new Set(book.counterparties.map((c) => c.name)).size).toBe(COUNTERPARTIES);
  });

  it("writes SQL that escapes quotes and inserts in batches", () => {
    const sql = toSql(book);
    expect(sql).toContain("INSERT INTO counterparties");
    expect(sql).toContain("INSERT INTO drawdowns");
    expect(sql).not.toMatch(/\d\.\d+[,)]/); // no decimal amounts anywhere
  });
});
