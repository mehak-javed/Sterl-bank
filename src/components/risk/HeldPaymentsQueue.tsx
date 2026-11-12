"use client";

import { useState } from "react";
import { useHeldPayments, useReviewPayment } from "@/lib/api/queries";
import { formatGBP } from "@/lib/money";
import type { HeldPayment } from "@/types/bank";
import { RULE_LABELS } from "../payments/paymentLabels";
import { QueryError, SkeletonRows } from "../QueryStates";

/**
 * The risk officer's queue: payments the screening rules paused. Each shows the reasons and the AI's
 * note; a person makes the final call (release = the money moves, reject = it never does), always with
 * a reason, which goes into the audit log.
 */
export function HeldPaymentsQueue() {
  const { data: held, isPending, isError, error, refetch } = useHeldPayments();
  return (
    <section aria-labelledby="held-heading" className="glass flex flex-col gap-4 rounded-3xl p-5">
      <div>
        <h2 id="held-heading" className="text-lg font-semibold text-heading">
          Payments waiting for review{held && held.length > 0 ? ` (${held.length})` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">Paused by the payment checks. No money has moved for any of these yet.</p>
      </div>
      {isPending ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <QueryError message={`We couldn't load the queue. ${error.message}`} onRetry={() => refetch()} />
      ) : held.length === 0 ? (
        <p className="text-sm text-muted">Nothing waiting. Every payment has been reviewed.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {held.map((payment) => (
            <HeldItem key={payment.id} payment={payment} />
          ))}
        </ul>
      )}
    </section>
  );
}

function HeldItem({ payment }: { payment: HeldPayment }) {
  const review = useReviewPayment();
  const [note, setNote] = useState("");
  const [missingNote, setMissingNote] = useState(false);
  const noteId = `note-${payment.id}`;

  function decide(action: "release" | "reject") {
    if (!note.trim()) {
      setMissingNote(true);
      return;
    }
    setMissingNote(false);
    review.mutate({ id: payment.id, action, note: note.trim() });
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xl font-semibold tabular-nums">{formatGBP(payment.amountPence)}</p>
          <p className="text-xs text-muted">
            {new Date(payment.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
          </p>
        </div>
        <p className="rounded-full border border-line px-3 py-1 text-xs font-semibold">Risk score {payment.riskScore}</p>
      </div>
      <ul aria-label="Reasons" className="flex flex-wrap gap-1.5">
        {payment.ruleHits.map((rule) => (
          <li key={rule} className="chip rounded-full px-2.5 py-1 text-xs font-medium">
            {RULE_LABELS[rule] ?? rule}
          </li>
        ))}
      </ul>
      {payment.reviewerNote && <p className="text-sm text-muted">{payment.reviewerNote}</p>}
      <label htmlFor={noteId} className="text-sm font-medium">
        Reason for your decision
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        aria-invalid={missingNote || undefined}
        aria-describedby={missingNote ? `${noteId}-error` : undefined}
        className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm aria-invalid:border-[var(--danger)]"
      />
      {missingNote && (
        <p id={`${noteId}-error`} className="text-sm text-[var(--danger)]">
          Give a reason: it goes in the audit log.
        </p>
      )}
      {review.isError && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {review.error.message}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => decide("release")} disabled={review.isPending} className="flex-1 rounded-xl btn-primary px-3 py-2.5 text-sm font-semibold disabled:opacity-50">
          Release payment
        </button>
        <button type="button" onClick={() => decide("reject")} disabled={review.isPending} className="flex-1 rounded-xl btn-secondary px-3 py-2.5 text-sm font-semibold disabled:opacity-50">
          Reject
        </button>
      </div>
    </li>
  );
}
