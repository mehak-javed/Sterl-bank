import type { ReactNode } from "react";
import customer from "@/mocks/data/customer.json";
import { AppShell } from "@/components/shell/AppShell";

/**
 * Wraps every banking page. "(bank)" is a route group: it shares this layout
 * but doesn't appear in the URL (/cards, not /bank/cards).
 * A layout stays mounted while you move between its pages, so the navigation never re-renders.
 *
 * The customer's name comes from the fake demo customer for now; once the website logs in
 * (Auth story A2), it comes from the session.
 */
export default function BankLayout({ children }: { children: ReactNode }) {
  return <AppShell customerName={`${customer.firstName} ${customer.lastName}`}>{children}</AppShell>;
}
