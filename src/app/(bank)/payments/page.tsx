import type { Metadata } from "next";
import { PaySomeone } from "@/components/payments/PaySomeone";

export const metadata: Metadata = { title: "Payments" };

/** Paying your saved payees. Every payment is screened by the bank before money moves. */
export default function PaymentsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Payments</h1>
      <PaySomeone />
    </>
  );
}
