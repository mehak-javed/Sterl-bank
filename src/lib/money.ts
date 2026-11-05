/**
 * Money helpers for Sterl.
 *
 * THE RULE: money is always an integer number of pence (1234 = £12.34).
 * We never store or calculate money as a float, because floats can't represent
 * most decimals exactly (try 0.1 + 0.2 in a console). Pounds only appear at the
 * very edge of the app, when we turn pence into text for the screen.
 */

/** An amount of money in pence. Always a safe integer. */
export type Pence = number;

/**
 * Throws if `value` isn't a valid pence amount.
 * Failing loudly is deliberate: a bank would rather crash than show a wrong balance.
 */
export function assertPence(value: number): asserts value is Pence {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Expected an integer number of pence, got ${value}`);
  }
}

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

/**
 * Formats pence for display: 1234 → "£12.34", -500 → "-£5.00".
 *
 * We build the decimal as a string ("12.34") with integer maths, then hand that
 * string to Intl. Intl formats decimal strings exactly, so not even the display
 * step goes through a float.
 */
export function formatGBP(pence: Pence): string {
  assertPence(pence);
  const sign = pence < 0 ? "-" : "";
  const abs = Math.abs(pence);
  const pennies = abs % 100;
  const pounds = (abs - pennies) / 100; // exact: abs - pennies is a multiple of 100
  const decimal = `${sign}${pounds}.${String(pennies).padStart(2, "0")}`;
  return gbpFormatter.format(decimal as Intl.StringNumericLiteral);
}

/**
 * Round-up: how many pence to move to savings so a spend reaches the next whole pound.
 *   roundUp(347) → 53   (£3.47 → £4.00)
 *   roundUp(500) → 0    (already a whole pound)
 *   roundUp(3.5) → throws TypeError (not valid pence)
 *   roundUp(-347) → throws RangeError
 *
 * Takes the positive SIZE of a spend, not a signed transaction amount. Deciding which
 * transactions qualify (card payments yes, refunds and incoming money no) is the caller's
 * job. A negative here means a sign bug upstream, so we fail loudly instead of guessing.
 * (Also: in JavaScript -347 % 100 is -47, so ignoring negatives would silently return 147.)
 */
export function roundUp(pence: Pence): Pence {
  assertPence(pence);
  if (pence < 0) {
    throw new RangeError(`roundUp expects the positive size of a spend, got ${pence}`);
  }
  const remainder = pence % 100;
  return remainder === 0 ? 0 : 100 - remainder;
}

/** Whole pounds, then optionally a dot and 1–2 digits. No spaces, signs or commas. */
const POUNDS_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses a pounds string a user typed into pence:
 *   toPence("12.34") → 1234
 *   toPence("12.3")  → 1230
 *   toPence("12")    → 1200
 *   toPence("12.345"), toPence("abc"), toPence(""), toPence(" 12.34 ") → throw
 *
 * Strict on purpose: no trimming. Cleaning up user input (trimming spaces) is the form
 * layer's job (Zod's .trim()), so this function does exactly one thing and never guesses.
 * Works on the string itself: no parseFloat, no multiplying a decimal by 100.
 */
export function toPence(input: string): Pence {
  const match = POUNDS_PATTERN.exec(input);
  if (!match) {
    throw new TypeError(`Not a valid pounds amount: "${input}"`);
  }
  const [, pounds, pennies = ""] = match;
  // Number(pounds) is a whole number, so * 100 is exact integer maths.
  const result = Number(pounds) * 100 + Number(pennies.padEnd(2, "0"));
  assertPence(result); // catches amounts too big to store exactly
  return result;
}

/**
 * Adds up pence amounts exactly. Integers add without rounding error, so a total of
 * many balances is always to the penny. Throws if the total gets too big to be exact.
 */
export function sumPence(amounts: readonly Pence[]): Pence {
  let total = 0;
  for (const amount of amounts) {
    assertPence(amount);
    total += amount;
  }
  assertPence(total);
  return total;
}
