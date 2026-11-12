import { z } from "zod";
import { formatGBP, toPence } from "@/lib/money";

/** The most you can send at a time. The Java API enforces the same limit (PaymentRequest.MAX_AMOUNT_PENCE). */
export const MAX_PAYMENT_PENCE = 1_000_000; // £10,000

/** Faster Payments references: up to 18 characters, from the set banks accept. Same rule as the API. */
const REFERENCE = /^[A-Za-z0-9 .,&/'-]*$/;

/**
 * The Pay someone form. The amount is typed in pounds ("25.50") and checked by turning it into whole
 * pence with toPence, which refuses anything that isn't an exact amount (no rounding, no floats).
 */
export const paymentSchema = z.object({
  fromAccountId: z.string().min(1, "Choose the account to pay from"),
  payeeId: z.string().min(1, "Choose who to pay"),
  amount: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      let pence: number;
      try {
        pence = toPence(value.replace(/^£/, ""));
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter an amount in pounds, like 25 or 25.50" });
        return;
      }
      if (pence <= 0) ctx.addIssue({ code: "custom", message: "Enter an amount more than £0.00" });
      else if (pence > MAX_PAYMENT_PENCE) ctx.addIssue({ code: "custom", message: `You can send up to ${formatGBP(MAX_PAYMENT_PENCE)} at a time` });
    }),
  reference: z.string().trim().max(18, "Use 18 characters or fewer").regex(REFERENCE, "Use letters, numbers and . , & / ' - only"),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/** A new payee. The same rules as the API's NewPayeeRequest, so the messages match. */
export const payeeSchema = z.object({
  name: z.string().trim().min(1, "Enter the name on their account").max(40, "Use 40 characters or fewer")
    .regex(/^[A-Za-z][A-Za-z .'&-]*$/, "Use letters, spaces and . ' & - only"),
  type: z.enum(["person", "business"], { message: "Choose person or business" }),
  sortCode: z.string().trim().regex(/^\d{2}-\d{2}-\d{2}$/, "Enter a sort code like 12-34-56"),
  accountNumber: z.string().trim().regex(/^\d{8}$/, "Enter an 8-digit account number"),
});
export type PayeeInput = z.infer<typeof payeeSchema>;
