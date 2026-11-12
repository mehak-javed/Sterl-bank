"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { logOut } from "@/lib/auth/client";

/**
 * Logs out on the SERVER (the session row is deleted, so the cookie is worthless even if copied),
 * forgets everything cached about the customer in this tab, then goes to the login page.
 */
export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const queries = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await logOut();
    queries.clear(); // no previous customer's data left in memory for the next person
    router.replace("/login");
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className}>
      <LogOut aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
