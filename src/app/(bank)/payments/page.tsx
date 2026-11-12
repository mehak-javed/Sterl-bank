import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

// Placeholder: the send-money form (React Hook Form + Zod, simulated name check) lands on Day 12.
export default function PaymentsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Payments</h1>
      <p className="glass rounded-2xl p-4 text-muted">
        Coming soon: send money to a payee, with a checked form and a payee name check.
      </p>
    </>
  );
}
