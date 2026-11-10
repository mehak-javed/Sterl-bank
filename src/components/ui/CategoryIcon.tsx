import {
  Banknote,
  CircleDollarSign,
  Clapperboard,
  Coins,
  type LucideIcon,
  PiggyBank,
  ReceiptText,
  Repeat,
  ShoppingBag,
  ShoppingBasket,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";
import type { Category } from "@/types/bank";

const ICONS: Partial<Record<Category, LucideIcon>> = {
  Groceries: ShoppingBasket,
  "Eating out": UtensilsCrossed,
  Transport: TrainFront,
  Entertainment: Clapperboard,
  Shopping: ShoppingBag,
  Bills: ReceiptText,
  Subscriptions: Repeat,
  Income: Banknote,
  Savings: PiggyBank,
  "Round-ups": Coins,
};

/** A category's icon in a gold chip. Decorative: the category name is always shown as text too. */
export function CategoryIcon({ category, className = "h-10 w-10" }: { category: string; className?: string }) {
  const Icon = ICONS[category as Category] ?? CircleDollarSign;
  return (
    <span aria-hidden="true" className={`chip ${className}`}>
      <Icon className="h-[45%] w-[45%]" strokeWidth={1.75} />
    </span>
  );
}
