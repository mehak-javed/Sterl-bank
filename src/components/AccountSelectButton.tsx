"use client";

import type { ReactNode } from "react";
import { useActiveAccountId } from "@/lib/api/queries";
import { useUiStore } from "@/stores/UiStoreProvider";

/**
 * The only interactive bit of an account row, so the only part that's a Client Component.
 *
 * `children` is the row's content (name, sort code, balance), rendered by the SERVER parent.
 * A Client Component can't import a Server Component, but it can RECEIVE one as children:
 * that's how you keep the "use client" boundary as small as possible.
 */
export function AccountSelectButton({ accountId, children }: { accountId: string; children: ReactNode }) {
  const activeId = useActiveAccountId();
  const selectAccount = useUiStore((s) => s.selectAccount);

  return (
    <button
      type="button"
      onClick={() => selectAccount(accountId)}
      aria-pressed={accountId === activeId}
      className="flex flex-1 items-center justify-between rounded-lg border border-line p-3 text-left aria-pressed:border-2 aria-pressed:border-primary"
    >
      {children}
    </button>
  );
}
