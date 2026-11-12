"use server";

/**
 * SERVER ACTIONS. "use server" turns every exported async function here into an endpoint:
 * a Client Component calls it like a normal function, and Next sends a POST request for us.
 *
 * Because it's really a public endpoint, treat every argument as untrusted input:
 * anyone could call it with anything. Validate here, on the server, even if the form
 * already checks in the browser. The Java API checks again, including WHO is asking (the session).
 */

import { refresh } from "next/cache";
import { formatGBP, toPence } from "@/lib/money";
import type { Account } from "@/types/bank";
import { getAccounts } from "./queries";
import { apiPost, SterlApiError } from "./sterl-api";

// ---------- Move money between your own accounts ----------

export type TransferField = "from" | "to" | "amount" | "reference";

export type TransferFormState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: Partial<Record<TransferField, string>>;
  /** What was typed, sent back so the form can show it again after an error. */
  values: Record<TransferField, string>;
  /** One key per transfer the user means to make, sent as the API's Idempotency-Key. */
  idempotencyKey: string;
};

const MAX_TRANSFER_PENCE = 1_000_000; // £10,000 per transfer
const MAX_REFERENCE_LENGTH = 18; // the UK Faster Payments limit for a reference

/**
 * IDEMPOTENCY: the same request twice must not move money twice (a double-click, a slow network retry,
 * a refresh). Each form carries a unique key, sent to the Java API as the Idempotency-Key header; the
 * API stores it in PostgreSQL and replays the original answer for a repeat, without moving money again.
 */

function text(formData: FormData, name: TransferField | "idempotencyKey"): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : ""; // a file upload would not be a string
}

/** Used with React's useActionState: it receives the previous state and the submitted form. */
export async function transferMoney(_previous: TransferFormState, formData: FormData): Promise<TransferFormState> {
  const idempotencyKey = text(formData, "idempotencyKey");
  const values = {
    from: text(formData, "from"),
    to: text(formData, "to"),
    amount: text(formData, "amount"),
    reference: text(formData, "reference"),
  };

  const failed = (fieldErrors: TransferFormState["fieldErrors"], message = "Please check the highlighted fields."): TransferFormState => ({
    status: "error",
    message,
    fieldErrors,
    values,
    idempotencyKey, // keep the same key: nothing was moved, so trying again is safe
  });

  if (!idempotencyKey) return failed({}, "Something went wrong with this form. Please reload the page.");

  // 1. Check every field and collect ALL problems, so the user can fix them in one go.
  const fieldErrors: TransferFormState["fieldErrors"] = {};
  // Only the customer's own accounts, as the API reports them (it decides who "the customer" is).
  const accounts: Account[] = await getAccounts();
  const from = accounts.find((a) => a.id === values.from);
  const to = accounts.find((a) => a.id === values.to);
  if (!from) fieldErrors.from = "Choose an account to move money from.";
  if (!to) fieldErrors.to = "Choose an account to move money to.";
  else if (values.from === values.to) fieldErrors.to = "Choose a different account from the one you're moving money from.";

  let amountPence = 0;
  if (!values.amount) {
    fieldErrors.amount = "Enter an amount.";
  } else {
    try {
      amountPence = toPence(values.amount.replace(/^£/, "")); // accept "£25" as well as "25"
      if (amountPence === 0) fieldErrors.amount = "Enter an amount more than £0.00.";
      else if (amountPence > MAX_TRANSFER_PENCE) fieldErrors.amount = `You can move up to ${formatGBP(MAX_TRANSFER_PENCE)} at a time.`;
    } catch {
      fieldErrors.amount = "Enter an amount in pounds, like 25 or 25.50.";
    }
  }

  if (values.reference.length > MAX_REFERENCE_LENGTH) {
    fieldErrors.reference = `Use ${MAX_REFERENCE_LENGTH} characters or fewer.`;
  }

  if (Object.keys(fieldErrors).length > 0 || !from || !to) return failed(fieldErrors);

  // 2. Move the money: the Java API locks both accounts, checks the balance and writes both ledger legs
  //    in ONE database transaction, so a parallel transfer can never overdraw the account.
  try {
    await apiPost(
      "/api/transfers",
      { fromAccountId: from.id, toAccountId: to.id, amountPence, reference: values.reference || null },
      { "Idempotency-Key": idempotencyKey },
    );
  } catch (error) {
    if (error instanceof SterlApiError && error.status === 422 && error.detail) {
      return failed({ amount: error.detail }); // e.g. "There isn't enough money in Everyday Account…"
    }
    return failed({}, "We couldn't make this transfer. Nothing was moved. Please try again.");
  }

  const success: TransferFormState = {
    status: "success",
    message: `Moved ${formatGBP(amountPence)} from ${from.name} to ${to.name}.`,
    fieldErrors: {},
    values: { from: values.from, to: values.to, amount: "", reference: "" },
    idempotencyKey: crypto.randomUUID(), // a fresh key: the NEXT transfer is a new one
  };

  // 3. Re-render the Server Components on screen (balances, account list) with the new data.
  refresh();
  return success;
}
