import { describe, expect, it } from "vitest";
import { formatGBP, roundUp, toPence } from "@/lib/money";

describe("formatGBP", () => {
  it("formats pence as pounds", () => {
    expect(formatGBP(1234)).toBe("£12.34");
  });

  it("keeps the leading zero on single-digit pence", () => {
    expect(formatGBP(105)).toBe("£1.05");
  });

  it("formats zero", () => {
    expect(formatGBP(0)).toBe("£0.00");
  });

  it("formats negative amounts (e.g. an outgoing payment)", () => {
    expect(formatGBP(-500)).toBe("-£5.00");
  });

  it("adds thousands separators", () => {
    expect(formatGBP(123456789)).toBe("£1,234,567.89");
  });

  it("stays exact for very large balances", () => {
    // 9,007,199,254,740,991 is Number.MAX_SAFE_INTEGER.
    expect(formatGBP(Number.MAX_SAFE_INTEGER)).toBe("£90,071,992,547,409.91");
  });

  it("rejects fractional pence", () => {
    expect(() => formatGBP(12.5)).toThrow(TypeError);
  });
});

describe("roundUp", () => {
  it("rounds 347 up by 53", () => {
    expect(roundUp(347)).toBe(53);
  });

  it("returns 0 for 500 (already a whole pound)", () => {
    expect(roundUp(500)).toBe(0);
  });

  it("returns 0 for 0", () => {
    expect(roundUp(0)).toBe(0);
  });

  it("rounds 1p up by 99", () => {
    expect(roundUp(1)).toBe(99);
  });

  it("throws for 3.5 (not valid pence)", () => {
    expect(() => roundUp(3.5)).toThrow(TypeError);
  });

  // Decision: roundUp takes the positive size of a spend. A negative means a sign bug
  // upstream (refunds should never reach here), so we throw rather than guess.
  it("throws a RangeError for a negative amount", () => {
    expect(() => roundUp(-347)).toThrow(RangeError);
  });
});

describe("toPence", () => {
  it('parses "12.34" to 1234', () => {
    expect(toPence("12.34")).toBe(1234);
  });

  it('parses "12.3" to 1230', () => {
    expect(toPence("12.3")).toBe(1230);
  });

  it('parses "12" to 1200', () => {
    expect(toPence("12")).toBe(1200);
  });

  it('parses "0.05" to 5', () => {
    expect(toPence("0.05")).toBe(5);
  });

  it('stays exact for "1.15" (where parseFloat * 100 gives 114.99999999999999)', () => {
    expect(toPence("1.15")).toBe(115);
  });

  it.each(["12.345", "abc", "", "12.", ".50", "-5", "1,000"])('throws for "%s"', (input) => {
    expect(() => toPence(input)).toThrow(TypeError);
  });

  // Stretch decision: strict. Trimming user input is the form layer's job (Zod .trim()).
  it('throws for " 12.34 " (spaces are not trimmed here)', () => {
    expect(() => toPence(" 12.34 ")).toThrow(TypeError);
  });

  it("throws for amounts too large to store exactly", () => {
    expect(() => toPence("999999999999999999")).toThrow(TypeError);
  });
});
