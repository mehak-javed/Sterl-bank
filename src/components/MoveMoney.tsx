import type { TransferFormState } from "@/server/actions";
import { getAccounts } from "@/server/queries";
import { SkeletonRows } from "./QueryStates";
import { TransferForm } from "./TransferForm";

/**
 * Server wrapper: loads the accounts and the form's starting state, then hands them
 * to the interactive form. After a transfer, refresh() re-renders this component,
 * so the balances in the "From" list update too.
 */
export async function MoveMoney() {
  const accounts = await getAccounts();
  const current = accounts.find((a) => a.type === "current") ?? accounts[0];
  const saver = accounts.find((a) => a.type === "saver") ?? accounts[1];

  const initialState: TransferFormState = {
    status: "idle",
    message: "",
    fieldErrors: {},
    values: { from: current?.id ?? "", to: saver?.id ?? "", amount: "", reference: "" },
    // Made on the server, so the server HTML and the browser agree (no hydration mismatch).
    idempotencyKey: crypto.randomUUID(),
  };

  return <TransferForm accounts={accounts} initialState={initialState} />;
}

export function MoveMoneySkeleton() {
  return (
    <section aria-busy="true" aria-label="Move money" className="glass rounded-2xl p-4">
      <p className="mb-3 text-lg font-semibold text-heading">Move money</p>
      <SkeletonRows rows={4} />
    </section>
  );
}
