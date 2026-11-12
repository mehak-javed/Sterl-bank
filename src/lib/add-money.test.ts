import { describe, expect, it } from "vitest";
import { checkAddMoneyAmount } from "./add-money";

describe("Add money amounts", () => {
  it("turns pounds into whole pence, with or without a £ sign", () => {
    expect(checkAddMoneyAmount("25")).toEqual({ pence: 2500 });
    expect(checkAddMoneyAmount(" £25.50 ")).toEqual({ pence: 2550 });
    expect(checkAddMoneyAmount("0.01")).toEqual({ pence: 1 });
  });

  it("allows exactly £10,000 but not a penny more", () => {
    expect(checkAddMoneyAmount("10000")).toEqual({ pence: 1_000_000 });
    expect(checkAddMoneyAmount("10000.01")).toEqual({ problem: "You can add up to £10,000.00 at a time." });
  });

  it("refuses zero, negatives, fractions of a penny and words", () => {
    expect(checkAddMoneyAmount("0")).toEqual({ problem: "Enter an amount more than £0.00." });
    for (const bad of ["-5", "1.234", "ten", "", "1e3"]) {
      expect(checkAddMoneyAmount(bad)).toHaveProperty("problem");
    }
  });
});
