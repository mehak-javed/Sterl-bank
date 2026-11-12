import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/**
 * Wraps every banking page. "(bank)" is a route group: it shares this layout
 * but doesn't appear in the URL (/cards, not /bank/cards).
 * A layout stays mounted while you move between its pages, so the navigation never re-renders.
 *
 * Every page in here needs a login: src/proxy.ts checks the session before serving them, and the
 * customer's name comes from that session.
 */
export default function BankLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
