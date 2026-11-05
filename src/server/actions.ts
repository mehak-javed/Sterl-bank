"use server";

/**
 * SERVER ACTIONS. "use server" turns every exported async function here into an endpoint:
 * a Client Component calls it like a normal function, and Next sends a POST request for us.
 *
 * Because it's really a public endpoint, treat every argument as untrusted input:
 * anyone could call it with anything. Validate here, on the server, even if the form
 * already checks in the browser. (In the "Security" phase, a login check goes here too.)
 */

import { refresh } from "next/cache";
import { formatGBP, toPence } from "@/lib/money";
import { findAccount, setRoundUpsEnabled, transferBetweenAccounts } from "./bank-db";

// ---------- Move money between your own accounts ----------

export type TransferField = "from" | "to" | "amount" | "reference";

export type TransferFormState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: Partial<Record<TransferField, string>>;
  /** What was typed, sent back so the form can show it again after an error. */
  values: Record<TransferField, string>;
  /** One key per transfer the user means to make. See `completedTransfers`. */
  idempotencyKey: string;
};

const MAX_TRANSFER_PENCE = 1_000_000; // £10,000 per transfer
const MAX_REFERENCE_LENGTH = 18; // the UK Faster Payments limit for a reference

/**
 * IDEMPOTENCY: the same request twice must not move money twice. A double-click, a slow network
 * retry or a refresh could all send the same transfer again. Each form carries a unique key;
 * if we've already completed that key, we send back the original answer and change nothing.
 * (A real bank keeps these keys in its database for about 24 hours. Here, in memory.)
 */
const completedTransfers = new Map<string, TransferFormState>();

function text(formData: FormData, name: TransferField | "idempotencyKey"): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : ""; // a file upload would not be a string
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const alreadyDone = completedTransfers.get(idempotencyKey);
  if (alreadyDone) return alreadyDone;

  await wait(300 + Math.random() * 500); // a realistic pause, so the "Moving…" state is visible

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
  const from = findAccount(values.from);
  const to = findAccount(values.to);
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

  // 2. Move the money. The balance check happens inside, at the same moment as the move.
  const result = transferBetweenAccounts(from.id, to.id, amountPence, values.reference);
  if (!result.ok) {
    if (result.reason === "insufficient_funds") {
      return failed({ amount: `There isn't enough money in ${from.name}. Its balance is ${formatGBP(from.balancePence)}.` });
    }
    return failed({}, "We couldn't make this transfer. Please try again.");
  }

  const success: TransferFormState = {
    status: "success",
    message: `Moved ${formatGBP(amountPence)} from ${result.from.name} to ${result.to.name}.`,
    fieldErrors: {},
    values: { from: values.from, to: values.to, amount: "", reference: "" },
    idempotencyKey: crypto.randomUUID(), // a fresh key: the NEXT transfer is a new one
  };
  completedTransfers.set(idempotencyKey, success);

  // 3. Re-render the Server Components on screen (balances, account list) with the new data.
  refresh();
  return success;
}

// ---------- Round-ups on / off ----------

export async function setRoundUps(enabled: boolean): Promise<{ ok: boolean }> {
  // TypeScript types vanish at runtime: a caller could send anything, so check it.
  if (typeof enabled !== "boolean") return { ok: false };

  await wait(300 + Math.random() * 500);
  // Like our API routes, fail about 1 time in 20, so we can see the switch roll back.
  if (Math.random() < 0.05) return { ok: false };

  setRoundUpsEnabled(enabled);
  refresh();
  return { ok: true };
}
