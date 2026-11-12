import { describe, expect, it } from "vitest";
import { payeeSchema, paymentSchema } from "./schemas";

const good = { fromAccountId: "a", payeeId: "p", amount: "25.50", reference: "Rent Nov" };
const messageFor = (input: object) => {
  const result = paymentSchema.safeParse(input);
  return result.success ? null : result.error.issues[0].message;
};

describe("the Pay someone form", () => {
  it("accepts an exact amount in pounds, with or without £", () => {
    expect(paymentSchema.safeParse(good).success).toBe(true);
    expect(paymentSchema.safeParse({ ...good, amount: "£10000" }).success).toBe(true); // exactly the limit
  });

  it("refuses amounts that aren't exact, positive and within the limit", () => {
    expect(messageFor({ ...good, amount: "1.234" })).toBe("Enter an amount in pounds, like 25 or 25.50");
    expect(messageFor({ ...good, amount: "0" })).toBe("Enter an amount more than £0.00");
    expect(messageFor({ ...good, amount: "10000.01" })).toBe("You can send up to £10,000.00 at a time");
  });

  it("keeps references to the 18 Faster Payments characters", () => {
    expect(messageFor({ ...good, reference: "x".repeat(19) })).toBe("Use 18 characters or fewer");
    expect(messageFor({ ...good, reference: "rent <script>" })).toBe("Use letters, numbers and . , & / ' - only");
  });
});

describe("adding a payee", () => {
  it("checks the sort code and account number like the bank does", () => {
    const ok = { name: "Sam Ortiz", type: "person", sortCode: "44-55-66", accountNumber: "87654321" };
    expect(payeeSchema.safeParse(ok).success).toBe(true);
    expect(payeeSchema.safeParse({ ...ok, sortCode: "445566" }).success).toBe(false);
    expect(payeeSchema.safeParse({ ...ok, accountNumber: "1234567" }).success).toBe(false);
  });
});
