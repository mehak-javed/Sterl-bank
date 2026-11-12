"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAccounts, useAddMoney } from "@/lib/api/queries";
import { checkAddMoneyAmount } from "@/lib/add-money";
import { formatGBP } from "@/lib/money";
import { Sheet } from "./shell/Sheet";

/**
 * "+ Add money": put money into one of your accounts. Saved in PostgreSQL as a double-entry ledger
 * transaction, so it shows in the balance, the statement and the cards that spend from the account.
 */
export function AddMoney({ triggerClassName }: { triggerClassName?: string }) {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const addMoney = useAddMoney();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // One key per amount the customer means to add: a retry or double tap reuses it, so the API adds
  // the money once. A fresh key only after a success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const amountId = useId();
  const accountFieldId = useId();
  const problemId = useId();

  const chosen = accountId || accounts?.find((a) => a.type === "current")?.id || accounts?.[0]?.id || "";

  function submit(close: () => void) {
    setDone(null);
    const checked = checkAddMoneyAmount(amount);
    if ("problem" in checked) return setProblem(checked.problem);
    const pence = checked.pence;
    if (!chosen) return setProblem("We couldn't find your account. Please reload the page.");
    setProblem(null);

    addMoney.mutate(
      { accountId: chosen, amountPence: pence, idempotencyKey },
      {
        onSuccess: () => {
          setDone(`${formatGBP(pence)} added.`);
          setAmount("");
          setIdempotencyKey(crypto.randomUUID());
          router.refresh(); // re-render the server-made parts (total balance, accounts, spending)
          close();
        },
        onError: (error) => setProblem(`We couldn't add the money, so nothing changed. ${error.message}`),
      },
    );
  }

  return (
    <>
      <Sheet
        title="Add money"
        trigger={
          <>
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            Add money
          </>
        }
        triggerClassName={
          triggerClassName ??
          "flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold whitespace-nowrap hover:border-accent"
        }
      >
        {(close) => (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit(close);
            }}
            className="flex flex-col gap-4"
          >
            {accounts && accounts.length > 1 && (
              <div className="flex flex-col gap-1">
                <label htmlFor={accountFieldId} className="text-sm font-medium">
                  To
                </label>
                <select
                  id={accountFieldId}
                  value={chosen}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="rounded-xl border border-line bg-surface-2 px-3 py-3"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatGBP(a.balancePence)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor={amountId} className="text-sm font-medium">
                Amount
              </label>
              <div className="flex items-center rounded-xl border border-line bg-surface-2 px-3 focus-within:border-accent">
                <span aria-hidden="true" className="text-muted">
                  £
                </span>
                <input
                  id={amountId}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={problem !== null}
                  aria-describedby={problem ? problemId : undefined}
                  className="w-full bg-transparent px-2 py-3 text-lg tabular-nums outline-none"
                />
              </div>
              {problem && (
                <p id={problemId} role="alert" className="text-sm text-[var(--danger)]">
                  {problem}
                </p>
              )}
            </div>

            <button type="submit" disabled={addMoney.isPending} className="rounded-2xl btn-primary px-4 py-3 font-semibold disabled:opacity-50">
              {addMoney.isPending ? "Adding…" : "Add money"}
            </button>
          </form>
        )}
      </Sheet>
      {/* Outside the sheet, so it's still announced after the sheet closes. */}
      <span role="status" className="sr-only">
        {done}
      </span>
    </>
  );
}
