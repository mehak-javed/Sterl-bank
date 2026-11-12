"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logOutAndLeave } from "@/lib/auth/client";

/**
 * Logs out on the SERVER (the session row is deleted, so the cookie is worthless even if copied), then
 * loads the login page fresh: every cached detail, open sheet and button state from this session is
 * gone (see logOutAndLeave for why it isn't an in-app jump).
 */
export function LogoutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true); // the page is about to be replaced; this only stops a double click meanwhile
        void logOutAndLeave();
      }}
      disabled={busy}
      className={className}
    >
      <LogOut aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
