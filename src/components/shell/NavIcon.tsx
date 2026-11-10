import {
  ArrowLeftRight,
  ChartCandlestick,
  CreditCard,
  House,
  type LucideIcon,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { NavLink } from "@/lib/nav";

/** One icon per section, so the sidebar and tab bar can be scanned without reading. */
const ICONS: Record<NavLink["href"], LucideIcon> = {
  "/dashboard": House,
  "/transactions": ArrowLeftRight,
  "/payments": Send,
  "/cards": CreditCard,
  "/credit-risk": ShieldCheck,
  "/markets": ChartCandlestick,
};

export function NavIcon({ href, className }: { href: NavLink["href"]; className?: string }) {
  const Icon = ICONS[href];
  // aria-hidden: the link's text already says where it goes; the icon is decoration.
  return <Icon aria-hidden="true" className={className} strokeWidth={1.75} />;
}
