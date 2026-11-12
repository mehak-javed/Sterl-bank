"use client";

import { initialsOf, useMe } from "@/lib/auth/useMe";

/** Who's logged in: the full chip in the sidebar, or just the initials in the phone top bar. */
const ROLE_LABELS: Record<string, string> = {
  customer: "Personal account",
  risk_officer: "Risk officer",
  trader: "Trader",
  admin: "Administrator",
};

export function CustomerChip({ variant }: { variant: "sidebar" | "avatar" }) {
  const { data: me } = useMe();
  // Staff have no customer record, so no name: show their work email and role instead.
  const name = me ? [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email : "";
  const initials = me ? initialsOf(me.firstName, me.lastName) || me.email.slice(0, 1).toUpperCase() : "";

  const avatar = (
    <span aria-hidden="true" className="chip h-9 w-9 text-sm font-semibold">
      {initials}
    </span>
  );
  if (variant === "avatar") return avatar;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3">
      {avatar}
      <span className="min-w-0 text-sm">
        {/* While loading, a quiet placeholder of the same height, so nothing jumps. */}
        <span className="block truncate font-semibold">{name || " "}</span>
        <span className="block text-xs text-muted">{me ? ROLE_LABELS[me.role] ?? "Personal account" : " "}</span>
      </span>
    </div>
  );
}

/** The customer's first name, for the dashboard greeting. */
export function CustomerFirstName() {
  const { data: me } = useMe();
  return <>{me?.firstName ?? " "}</>;
}
