"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useAddPayee } from "@/lib/api/queries";
import { payeeSchema, type PayeeInput } from "@/lib/payments/schemas";
import type { SavedPayee } from "@/types/bank";
import { AuthField as Field, describe, inputClass } from "../auth/AuthFields";
import { Sheet } from "../shell/Sheet";

/** "+ New payee": save someone's account to pay. New payees count as new for 24 hours in the bank's checks. */
export function AddPayee({ onAdded }: { onAdded: (payee: SavedPayee) => void }) {
  const uid = useId();
  const addPayee = useAddPayee();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayeeInput>({ resolver: zodResolver(payeeSchema), defaultValues: { name: "", type: "person", sortCode: "", accountNumber: "" } });

  return (
    <Sheet
      title="New payee"
      trigger={
        <>
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          New payee
        </>
      }
      triggerClassName="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold whitespace-nowrap hover:border-accent"
    >
      {(close) => (
        <form
          noValidate
          onSubmit={(e) =>
            handleSubmit((values) =>
              addPayee.mutate(values, {
                onSuccess: (payee) => {
                  reset();
                  close();
                  onAdded(payee);
                },
              }),
            )(e)
          }
          className="flex flex-col gap-4"
        >
          <Field id={`${uid}-name`} label="Name on their account" error={errors.name?.message}>
            <input {...register("name")} {...describe(`${uid}-name`, errors.name?.message)} autoComplete="off" className={inputClass} />
          </Field>
          <fieldset className="flex gap-4">
            <legend className="mb-1.5 text-sm font-medium">This is a</legend>
            {(["person", "business"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input type="radio" value={type} {...register("type")} /> {type === "person" ? "Person" : "Business"}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${uid}-sort`} label="Sort code" error={errors.sortCode?.message}>
              <input {...register("sortCode")} {...describe(`${uid}-sort`, errors.sortCode?.message)} inputMode="numeric" placeholder="12-34-56" className={inputClass} />
            </Field>
            <Field id={`${uid}-number`} label="Account number" error={errors.accountNumber?.message}>
              <input {...register("accountNumber")} {...describe(`${uid}-number`, errors.accountNumber?.message)} inputMode="numeric" maxLength={8} className={inputClass} />
            </Field>
          </div>
          {addPayee.isError && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              We couldn&apos;t save this payee. {addPayee.error.message}
            </p>
          )}
          <button type="submit" disabled={addPayee.isPending} className="rounded-2xl btn-primary px-4 py-3 font-semibold disabled:opacity-50">
            {addPayee.isPending ? "Saving…" : "Save payee"}
          </button>
        </form>
      )}
    </Sheet>
  );
}
