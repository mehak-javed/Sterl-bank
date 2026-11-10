import type { Transaction } from "@/types/bank";

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" });

export type DayGroup = { key: string; label: string; transactions: Transaction[] };

/**
 * Groups a newest-first list of transactions by UK calendar day ("Saturday 31 October"), keeping
 * their order. A payment at 23:30 UTC on a summer night belongs to the next UK day.
 */
export function groupByUkDay(transactions: readonly Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const t of transactions) {
    const date = new Date(t.date);
    const key = dayKey.format(date); // "2026-10-31" (en-CA formats dates as YYYY-MM-DD)
    const last = groups.at(-1);
    if (last?.key === key) last.transactions.push(t);
    else groups.push({ key, label: dayLabel.format(date), transactions: [t] });
  }
  return groups;
}
