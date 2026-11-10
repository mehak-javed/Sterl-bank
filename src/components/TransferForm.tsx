"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";
import { formatGBP } from "@/lib/money";
import { transferMoney, type TransferField, type TransferFormState } from "@/server/actions";
import type { Account } from "@/types/bank";

/**
 * <form action={serverAction}>: the form posts straight to the server action.
 * useActionState gives us the action's latest answer (state) and whether it's still running.
 */
export function TransferForm({ accounts, initialState }: { accounts: Account[]; initialState: TransferFormState }) {
  const [state, formAction, isPending] = useActionState(transferMoney, initialState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state.status !== "success") return;
    // refresh() in the action already re-rendered the SERVER components. The browser-side
    // TanStack cache (recent transactions, transactions page) doesn't know yet, so tell it.
    void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }, [state, queryClient]);

  // Links a field to its error message, so screen readers read the error with the field.
  const errorProps = (field: TransferField) =>
    state.fieldErrors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `transfer-${field}-error` }
      : {};

  const fieldError = (field: TransferField) =>
    state.fieldErrors[field] && (
      <span id={`transfer-${field}-error`} className="text-sm font-medium text-heading">
        {state.fieldErrors[field]}
      </span>
    );

  const inputClass =
    // w-full min-w-0: a <select> is otherwise as wide as its longest option, which pushed the
    // whole page wider than a phone screen.
    "w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 py-2.5 aria-invalid:border-2 aria-invalid:border-heading";

  return (
    // id="move-money": the dashboard's "Move money" quick action jumps here.
    <section id="move-money" aria-labelledby="transfer-heading" className="rise-in glass scroll-mt-6 rounded-3xl p-5">
      <h2 id="transfer-heading" className="mb-3 text-lg font-semibold text-heading">
        Move money
      </h2>

      {/* noValidate: we show our own clear messages instead of the browser's pop-ups. */}
      <form action={formAction} noValidate className="flex flex-col gap-3">
        <input type="hidden" name="idempotencyKey" value={state.idempotencyKey} />

        <label className="flex flex-col gap-1 text-sm font-medium">
          From
          <select name="from" defaultValue={state.values.from} className={inputClass} {...errorProps("from")}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatGBP(a.balancePence)})
              </option>
            ))}
          </select>
          {fieldError("from")}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          To
          <select name="to" defaultValue={state.values.to} className={inputClass} {...errorProps("to")}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {fieldError("to")}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Amount in £
          {/* type="text" + inputMode="decimal": number keypad on phones, but no browser
              number quirks (scroll-to-change, "1e5"). The server parses it with toPence. */}
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            defaultValue={state.values.amount}
            className={inputClass}
            {...errorProps("amount")}
          />
          {fieldError("amount")}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Reference (optional)
          <input
            name="reference"
            maxLength={18}
            autoComplete="off"
            defaultValue={state.values.reference}
            className={inputClass}
            {...errorProps("reference")}
          />
          {fieldError("reference")}
        </label>

        {/* Disabled while running: one click, one transfer. The idempotency key is the server-side backup. */}
        <button type="submit" disabled={isPending} className="rounded-xl btn-primary px-4 py-2 font-semibold disabled:opacity-50">
          {isPending ? "Moving…" : "Move money"}
        </button>

        {/* Always in the page, so screen readers notice when its text changes. */}
        <p role="status" className="text-sm font-medium">
          {state.status === "success" ? state.message : ""}
        </p>
        {state.status === "error" && (
          <p role="alert" className="text-sm">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
