import { splitGBP, type Pence } from "@/lib/money";

/**
 * An amount with the pence slightly smaller, the way banking apps show balances: £6,311.65.
 * tabular-nums: every digit is the same width, so amounts line up in columns and don't jump around.
 * Works in Server and Client Components (no hooks).
 */
export function Money({
  pence,
  className = "",
  fractionClassName = "text-[0.62em] opacity-80",
  showPlus = false,
}: {
  pence: Pence;
  className?: string;
  fractionClassName?: string;
  /** "+" for money in: never rely on colour alone to show direction. */
  showPlus?: boolean;
}) {
  const { whole, fraction } = splitGBP(pence);
  return (
    <span className={`tabular-nums ${className}`}>
      {showPlus && pence > 0 ? "+" : ""}
      {whole}
      <span className={fractionClassName}>{fraction}</span>
    </span>
  );
}
