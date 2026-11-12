"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useAccounts, usePay, usePayees, usePayments } from "@/lib/api/queries";
import { formatGBP, toPence } from "@/lib/money";
import { paymentSchema, type PaymentInput } from "@/lib/payments/schemas";
import type { Payment } from "@/types/bank";
import { AuthField as Field, describe, inputClass } from "../auth/AuthFields";
import { QueryError, SkeletonRows } from "../QueryStates";
import { AddPayee } from "./AddPayee";
import { STATUS_LABELS } from "./paymentLabels";

/**
 * Pay someone: choose the account, the payee and the amount. The bank screens every payment first:
 * most are sent at once; a few are paused for a quick security check (no money moves until a risk
 * officer releases them). The customer sees what happens next, never why in rule terms.
 */
export function PaySomeone() {
  const uid = useId();
  const { data: accounts } = useAccounts();
  const payees = usePayees();
  const pay = usePay();
  const [result, setResult] = useState<Payment | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // One key per payment the customer means to make: a retry of the SAME payment reuses it, so the bank
  // can't pay twice. A new key after any answer from the bank (sent, held or refused).
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    resetField,
    formState: { errors },
  } = useForm<PaymentInput>({ resolver: zodResolver(paymentSchema), defaultValues: { fromAccountId: "", payeeId: "", amount: "", reference: "" } });

  // Default to the main current account once accounts arrive.
  useEffect(() => {
    const main = accounts?.find((a) => a.type === "current") ?? accounts?.[0];
    if (main && !getValues("fromAccountId")) setValue("fromAccountId", main.id);
  }, [accounts, getValues, setValue]);

  function onSubmit(values: PaymentInput) {
    setProblem(null);
    setResult(null);
    pay.mutate(
      {
        fromAccountId: values.fromAccountId,
        payeeId: values.payeeId,
        amountPence: toPence(values.amount.replace(/^£/, "")),
        reference: values.reference || null,
        idempotencyKey,
      },
      {
        onSuccess: (payment) => {
          setResult(payment);
          setIdempotencyKey(crypto.randomUUID());
          resetField("amount");
          resetField("reference");
        },
        onError: (error) => {
          // The bank answered (e.g. not enough money): this payment is finished, so the next try is new.
          // No answer (network) or a server error: keep the key, so trying again can't pay twice.
          if (error instanceof ApiError && error.status < 500) setIdempotencyKey(crypto.randomUUID());
          setProblem(`We couldn't send this payment. ${error.message}`);
        },
      },
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section aria-labelledby={`${uid}-heading`} className="glass flex flex-col gap-5 rounded-3xl p-5 lg:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${uid}-heading`} className="text-lg font-semibold text-heading">
            Pay someone
          </h2>
          <AddPayee onAdded={(payee) => setValue("payeeId", payee.id, { shouldValidate: true })} />
        </div>

        {payees.isPending ? (
          <SkeletonRows rows={3} />
        ) : payees.isError ? (
          <QueryError message={`We couldn't load your payees. ${payees.error.message}`} onRetry={() => payees.refetch()} />
        ) : payees.data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
            You haven&apos;t saved anyone to pay yet. Add a new payee to get started.
          </p>
        ) : (
          <form noValidate onSubmit={(e) => handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
            <Field id={`${uid}-from`} label="From" error={errors.fromAccountId?.message}>
              <select {...register("fromAccountId")} {...describe(`${uid}-from`, errors.fromAccountId?.message)} className={inputClass}>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatGBP(a.balancePence)})
                  </option>
                ))}
              </select>
            </Field>
            <Field id={`${uid}-payee`} label="To" error={errors.payeeId?.message}>
              <select {...register("payeeId")} {...describe(`${uid}-payee`, errors.payeeId?.message)} className={inputClass}>
                <option value="">Choose a payee</option>
                {payees.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.sortCode} · ••••{p.accountNumberLast4}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id={`${uid}-amount`} label="Amount (£)" error={errors.amount?.message}>
                <input {...register("amount")} {...describe(`${uid}-amount`, errors.amount?.message)} inputMode="decimal" placeholder="0.00" autoComplete="off" className={inputClass} />
              </Field>
              <Field id={`${uid}-reference`} label="Reference (optional)" error={errors.reference?.message}>
                <input {...register("reference")} {...describe(`${uid}-reference`, errors.reference?.message)} maxLength={18} autoComplete="off" className={inputClass} />
              </Field>
            </div>
            {problem && (
              <p role="alert" className="rounded-xl border border-[var(--danger)] p-3 text-sm">
                {problem}
              </p>
            )}
            <button type="submit" disabled={pay.isPending} className="rounded-2xl btn-primary px-4 py-3 font-semibold disabled:opacity-50">
              {pay.isPending ? "Sending…" : "Send payment"}
            </button>
          </form>
        )}

        {result && <PaymentResult payment={result} />}
      </section>

      <RecentPayments className="lg:col-span-5" />
    </div>
  );
}

/** What happened, said plainly. role="status": read out by screen readers when it appears. */
function PaymentResult({ payment }: { payment: Payment }) {
  const sent = payment.status === "settled";
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 ${sent ? "border-line" : "border-accent"}`}>
      {sent ? (
        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
      ) : (
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
      )}
      <div className="text-sm">
        <p className="font-semibold">
          {sent ? `${formatGBP(payment.amountPence)} sent to ${payment.payeeName}` : `${formatGBP(payment.amountPence)} to ${payment.payeeName}: security check`}
        </p>
        <p className="mt-1 text-muted">{payment.message}</p>
      </div>
    </div>
  );
}

function RecentPayments({ className = "" }: { className?: string }) {
  const { data: payments, isPending, isError, error, refetch } = usePayments();
  return (
    <section aria-labelledby="recent-payments-heading" className={`glass flex flex-col gap-4 rounded-3xl p-5 ${className}`}>
      <h2 id="recent-payments-heading" className="text-lg font-semibold text-heading">
        Recent payments
      </h2>
      {isPending ? (
        <SkeletonRows rows={4} />
      ) : isError ? (
        <QueryError message={`We couldn't load your payments. ${error.message}`} onRetry={() => refetch()} />
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted">No payments yet.</p>
      ) : (
        <ul className="flex flex-col">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.payeeName}</span>
                <span className="block text-xs text-muted">
                  {new Date(p.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
                  {p.reference ? ` · ${p.reference}` : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-semibold tabular-nums">{formatGBP(p.amountPence)}</span>
                <span className={`block text-xs ${p.status === "rejected" ? "text-[var(--danger)]" : p.status === "held" ? "text-heading" : "text-muted"}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
