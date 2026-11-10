"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setRoundUps } from "@/server/actions";

/**
 * An on/off switch saved through a server action, with React's useOptimistic.
 *
 * `enabled` comes from the server. While the action runs, useOptimistic shows the NEW value.
 * When it finishes: on success, refresh() sends the new server value, so it stays.
 * On failure, the server value never changed, so the switch flips back BY ITSELF:
 * no snapshot or manual rollback needed (compare useSetCardFrozen in queries.ts).
 */
export function RoundUpToggle({ enabled }: { enabled: boolean }) {
  const [shownEnabled, setShownEnabled] = useOptimistic(enabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (isPending) return; // ignore clicks while saving (aria-disabled doesn't block them by itself)
    const next = !shownEnabled;
    setError(null);
    startTransition(async () => {
      setShownEnabled(next);
      const result = await setRoundUps(next);
      if (!result.ok) setError("We couldn't change your round-ups, so nothing changed. Please try again.");
    });
  }

  return (
    <section aria-labelledby="roundups-heading" className="rise-in glass flex flex-col gap-3 rounded-3xl p-5">
      <h2 id="roundups-heading" className="text-lg font-semibold text-heading">
        Round-ups
      </h2>
      <p className="text-sm text-muted">
        Round each card payment up to the next pound and save the change in your Round-up Pot.
      </p>

      {/* role="switch" + aria-checked: screen readers say "Round up my card payments, switch, on". */}
      <button
        type="button"
        role="switch"
        aria-checked={shownEnabled}
        // aria-disabled, not disabled: a disabled button loses keyboard focus mid-click.
        aria-disabled={isPending}
        onClick={toggle}
        className="flex items-center justify-between gap-4 rounded-lg border border-line p-3 text-left font-medium"
      >
        Round up my card payments
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 shrink-0 rounded-full border border-line transition-colors ${shownEnabled ? "btn-primary" : "bg-background"}`}
        >
          <span
            className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-foreground transition-[left] motion-reduce:transition-none ${shownEnabled ? "left-5.5" : "left-0.5"}`}
          />
        </span>
      </button>

      {/* Words, not just the switch's position: never rely on a visual alone. */}
      <p role="status" className="text-sm">
        Round-ups are <strong>{shownEnabled ? "on" : "off"}</strong>
        {isPending ? " (saving…)" : ""}
      </p>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
