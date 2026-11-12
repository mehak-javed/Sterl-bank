import type { PaymentStatus } from "@/types/bank";

/** What each status means to the customer, in their words (never "held by rule X"). */
export const STATUS_LABELS: Record<PaymentStatus, string> = {
  settled: "Sent",
  held: "Security check",
  released: "Sent after check",
  rejected: "Not sent",
};

/** For staff: the screening rules in plain words. */
export const RULE_LABELS: Record<string, string> = {
  HIGH_VALUE: "£5,000 or more",
  LARGE_FOR_THIS_CUSTOMER: "Unusually large",
  RAPID_REPEAT: "Rapid repeats",
  NEW_PAYEE: "New payee",
};
