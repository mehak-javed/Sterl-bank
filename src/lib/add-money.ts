import { formatGBP, toPence, type Pence } from "./money";

/** The most you can add at a time. The Java API enforces the same limit (AddMoneyService.MAX_PENCE). */
export const MAX_ADD_MONEY_PENCE = 1_000_000; // £10,000

/** Turns what was typed ("25", "£25.50") into pence, or a message saying what's wrong. */
export function checkAddMoneyAmount(input: string): { pence: Pence } | { problem: string } {
  let pence: Pence;
  try {
    pence = toPence(input.trim().replace(/^£/, ""));
  } catch {
    return { problem: "Enter an amount in pounds, like 25 or 25.50." };
  }
  if (pence <= 0) return { problem: "Enter an amount more than £0.00." };
  if (pence > MAX_ADD_MONEY_PENCE) return { problem: `You can add up to ${formatGBP(MAX_ADD_MONEY_PENCE)} at a time.` };
  return { pence };
}
