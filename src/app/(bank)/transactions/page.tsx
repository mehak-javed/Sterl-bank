import type { Metadata } from "next";
import { TransactionsView } from "@/components/TransactionsView";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Transactions</h1>
      <TransactionsView />
    </>
  );
}
