/**
 * FX reference rates: shared types and helpers (used by server and browser).
 *
 * A reference rate is "how many units of the quote currency for 1 GBP", e.g.
 * GBP/USD 1.3469 means £1 buys $1.3469. Rates are ratios, not money, so they can be
 * decimals. Money amounts stay integers in the currency's minor unit (pence, cents, yen).
 */

/** Currencies the FX desk supports (fiat only; Frankfurter also lists crypto we ignore). */
export const SUPPORTED_QUOTES = [
  "USD", "EUR", "JPY", "CHF", "AUD", "CAD", "NZD", "SEK", "NOK", "DKK",
  "HKD", "SGD", "CNY", "INR", "ZAR", "PLN", "MXN", "TRY", "CZK", "HUF",
] as const;
export type QuoteCurrency = (typeof SUPPORTED_QUOTES)[number];

export type ReferenceRate = {
  pair: `GBP/${QuoteCurrency}`;
  quote: QuoteCurrency;
  rate: number;
  date: string; // "2026-11-05": the day the central bank published it
};

export type ReferenceRates = {
  base: "GBP";
  /** "live" = fetched from Frankfurter; "fallback" = our saved copy because the source was down. */
  source: "live" | "fallback";
  rates: ReferenceRate[];
};

/** Frankfurter v2 returns [{ date, base, quote, rate }, ...]. Convert to our own shape. */
export function normaliseFrankfurter(raw: unknown): ReferenceRate[] {
  if (!Array.isArray(raw)) throw new Error("Unexpected FX response: not a list");
  const supported = new Set<string>(SUPPORTED_QUOTES);
  const rates: ReferenceRate[] = [];
  for (const row of raw) {
    if (
      typeof row === "object" && row !== null &&
      "quote" in row && typeof row.quote === "string" && supported.has(row.quote) &&
      "rate" in row && typeof row.rate === "number" && Number.isFinite(row.rate) && row.rate > 0 &&
      "date" in row && typeof row.date === "string"
    ) {
      const quote = row.quote as QuoteCurrency;
      rates.push({ pair: `GBP/${quote}`, quote, rate: row.rate, date: row.date });
    }
  }
  if (rates.length === 0) throw new Error("Unexpected FX response: no supported currencies");
  // Keep the order of SUPPORTED_QUOTES, so the watchlist is stable.
  return rates.sort((a, b) => SUPPORTED_QUOTES.indexOf(a.quote) - SUPPORTED_QUOTES.indexOf(b.quote));
}

/** Minor units per major unit: 2 for GBP/USD (pence, cents), 0 for JPY and HUF. */
export function minorDigits(currency: string): number {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * Converts a GBP amount in pence into the quote currency's minor units.
 * Multiplying by a decimal rate gives a fraction, so we round ONCE, here, explicitly
 * (to the nearest unit, halves away from zero). Every conversion in Sterl goes through this.
 */
export function convertFromPence(pence: number, rate: number, quote: string): number {
  if (!Number.isSafeInteger(pence)) throw new TypeError(`Expected integer pence, got ${pence}`);
  const majorAmount = pence / 100;
  const scale = 10 ** minorDigits(quote);
  const minor = Math.sign(majorAmount) * Math.round(Math.abs(majorAmount) * rate * scale);
  return minor;
}

/** Formats an amount in minor units for display: (134690, "USD") → "US$1,346.90". */
export function formatMinor(minor: number, currency: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 10 ** digits);
}

/** Rates shown to 4 decimals (1.3469), or 2 for big numbers like GBP/JPY (204.31). */
export function formatRate(rate: number): string {
  const digits = rate >= 100 ? 2 : 4;
  return rate.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
