"use client";

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export const inputClass =
  "w-full min-w-0 rounded-xl border border-line bg-surface-2 px-4 py-3 text-base aria-invalid:border-[var(--danger)]";

/** A label, the input, and its error underneath, linked for screen readers (aria-describedby). */
export function AuthField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

/** The accessibility attributes for an input with an optional error (and optional extra hint id). */
export function describe(id: string, error?: string, extra?: string) {
  const ids = [error && `${id}-error`, extra].filter(Boolean).join(" ");
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined };
}

/**
 * A password input with a Show / Hide button. forwardRef: React Hook Form's register() hands the
 * input a ref, which has to reach the real <input>.
 */
export const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} ref={ref} type={visible ? "text" : "password"} className={`${inputClass} pr-20`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground"
      >
        {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
});
