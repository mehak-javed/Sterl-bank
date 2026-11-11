import { fakerEN_GB as faker } from "@faker-js/faker";
import { assertPence, roundUp, type Pence } from "@/lib/money";
import type {
  Account,
  AccountType,
  BankData,
  Card,
  CardProduct,
  Category,
  Customer,
  Payee,
  SpendCategory,
  Transaction,
  TransactionKind,
} from "@/types/bank";
import { CARD_PRODUCTS } from "@/lib/cards";

/**
 * Sterl's fake bank: one customer, three accounts, ~90 days of history.
 *
 * Deterministic: same SEED + same REF_DATE = byte-identical output every run.
 * Two things make that true:
 *   1. faker.seed() fixes the random numbers.
 *   2. REF_DATE fixes "now". faker.date.recent() would use the real clock and
 *      change every day, even with a seed.
 */
export const SEED = 42;
export const REF_DATE = new Date("2026-11-01T00:00:00.000Z");
const DAYS_OF_HISTORY = 90;
const CARD_PAYMENT_COUNT = 500;

const WINDOW_START = new Date(REF_DATE.getTime() - DAYS_OF_HISTORY * 24 * 60 * 60 * 1000);

// Invented merchants (never real brands) with a realistic spend range in pence.
const MERCHANTS: Record<SpendCategory, { names: string[]; min: Pence; max: Pence; weight: number }> = {
  Groceries: { names: ["Greenleaf Market", "Corner Fresh", "Harbour Foods", "Daily Basket"], min: 150, max: 3_500, weight: 30 },
  "Eating out": { names: ["The Copper Kettle", "Bao House", "Lantern Pizza", "Bean & Leaf Coffee"], min: 300, max: 1_800, weight: 25 },
  Transport: { names: ["CityLine Travel", "RideNow", "Metro Fuel"], min: 160, max: 1_200, weight: 20 },
  Shopping: { names: ["Thread & Co", "Bookends", "Volt Electronics", "Homeware Hall"], min: 500, max: 4_500, weight: 15 },
  Entertainment: { names: ["Starlight Cinema", "Arcade Bowl", "Ticket Booth"], min: 500, max: 2_000, weight: 10 },
};

// Monthly payments on a fixed day: the "subscription detector" will find these later.
type Recurring = {
  day: number;
  description: string;
  amountPence: Pence; // positive size; the sign is applied below
  category: Category;
  kind: TransactionKind;
};
const RECURRING_OUT: Recurring[] = [
  { day: 1, description: "Council Tax", amountPence: 14_200, category: "Bills", kind: "direct_debit" },
  { day: 3, description: "StreamFlix", amountPence: 1_099, category: "Subscriptions", kind: "card" },
  { day: 7, description: "PulseGym", amountPence: 3_499, category: "Subscriptions", kind: "card" },
  { day: 10, description: "Brightwatt Energy", amountPence: 8_700, category: "Bills", kind: "direct_debit" },
  { day: 14, description: "TuneBox", amountPence: 1_199, category: "Subscriptions", kind: "card" },
  { day: 20, description: "Skyline Mobile", amountPence: 1_800, category: "Bills", kind: "direct_debit" },
];
const SALARY = { day: 25, description: "Salary - Northwind Studios Ltd", amountPence: 340_000 };
const RENT = { day: 1, amountPence: 95_000 };
const MONTHLY_SAVING = { day: 26, amountPence: 20_000 };

type Draft = Omit<Transaction, "balanceAfterPence">;

export function generateBank(): BankData {
  faker.seed(SEED); // reset here, so every call gives the same data

  const customer = makeCustomer();
  const payees = makePayees();
  const landlord = payees[0];

  const accounts = {
    current: makeAccount(customer.id, "current", "Everyday Account", 150_000),
    saver: makeAccount(customer.id, "saver", "Rainy Day Saver", 420_000),
    roundup: makeAccount(customer.id, "roundup", "Round-up Pot", 1_250),
  };

  const drafts: Draft[] = [];
  const current = accounts.current.id;

  // 1. Random card payments.
  for (let i = 0; i < CARD_PAYMENT_COUNT; i++) {
    const category = faker.helpers.weightedArrayElement(
      (Object.keys(MERCHANTS) as SpendCategory[]).map((c) => ({ value: c, weight: MERCHANTS[c].weight })),
    );
    const { names, min, max } = MERCHANTS[category];
    drafts.push({
      id: faker.string.uuid(),
      accountId: current,
      date: faker.date.between({ from: WINDOW_START, to: REF_DATE }).toISOString(),
      description: faker.helpers.arrayElement(names),
      category,
      kind: "card",
      amountPence: -faker.number.int({ min, max }),
    });
  }

  // 2. Monthly money in and out.
  for (const { year, month } of monthsInWindow()) {
    const on = (day: number) => monthDay(year, month, day);
    for (const r of RECURRING_OUT) {
      const date = on(r.day);
      if (date) drafts.push(single(current, date, r.description, r.category, r.kind, -r.amountPence));
    }
    const payday = on(SALARY.day);
    if (payday) drafts.push(single(current, payday, SALARY.description, "Income", "salary", SALARY.amountPence));
    const rentDay = on(RENT.day);
    if (rentDay) {
      drafts.push(single(current, rentDay, `Rent - ${landlord.name}`, "Bills", "standing_order", -RENT.amountPence));
    }
    const saveDay = on(MONTHLY_SAVING.day);
    if (saveDay) {
      drafts.push(...transfer(current, accounts.saver.id, MONTHLY_SAVING.amountPence, saveDay, "Monthly saving", "Savings", "transfer"));
    }
  }

  // 3. Round-ups: every card payment is rounded up to the next £1 and the spare
  //    change moves to the Round-up Pot, batched into one transfer per day.
  const roundUpsByDay = new Map<string, Pence>();
  for (const t of drafts) {
    if (t.kind !== "card") continue;
    const day = t.date.slice(0, 10); // "2026-10-14"
    roundUpsByDay.set(day, (roundUpsByDay.get(day) ?? 0) + roundUp(-t.amountPence));
  }
  for (const [day, total] of [...roundUpsByDay].sort(([a], [b]) => a.localeCompare(b))) {
    if (total === 0) continue;
    drafts.push(...transfer(current, accounts.roundup.id, total, `${day}T23:59:00.000Z`, "Round-ups", "Round-ups", "roundup"));
  }

  // 4. Work out running balances, oldest first, like a statement.
  const allAccounts = Object.values(accounts);
  const transactions: Transaction[] = [];
  for (const account of allAccounts) {
    const own = drafts.filter((t) => t.accountId === account.id).sort(byDateThenId);
    let balance = account.openingBalancePence;
    for (const t of own) {
      balance += t.amountPence;
      assertPence(balance);
      transactions.push({ ...t, balanceAfterPence: balance });
    }
    account.balancePence = balance;
  }

  transactions.sort((a, b) => byDateThenId(b, a)); // newest first for the screens
  checkBooksBalance(allAccounts, transactions);

  // 5. The cards. Made last so adding them didn't change any of the data above:
  //    every faker call shifts the random sequence for everything after it.
  //    Last 4 digits only, all from PUBLISHED test numbers:
  //    4242 = Visa 4242 4242 4242 4242 · 5556 = Visa debit 4000 0566 5566 5556
  //    4444 = Mastercard 5555 5555 5555 4444 · 8210 = Mastercard debit 5200 8282 8282 8210
  const nameOnCard = `${customer.firstName} ${customer.lastName}`.toUpperCase();
  const card = (product: CardProduct, last4: string, expiryMonth: number, years: number): Card => ({
    id: faker.string.uuid(),
    accountId: current,
    product,
    brand: CARD_PRODUCTS[product].network,
    nameOnCard,
    last4,
    expiryMonth,
    expiryYear: REF_DATE.getUTCFullYear() + years,
    frozen: false,
  });
  const cards: Card[] = [
    card("debit", "4242", 9, 3), // the original card, first, so its id is unchanged
    card("premier", "8210", 4, 4),
    card("travel", "4444", 12, 3),
    card("virtual", "5556", 6, 2),
  ];

  return { customer, accounts: allAccounts, transactions, payees, cards };
}

/**
 * The bank's golden rules, checked every time we generate. If either fails we
 * refuse to write the data rather than ship a bank whose numbers don't add up.
 */
function checkBooksBalance(accounts: Account[], transactions: Transaction[]): void {
  for (const account of accounts) {
    const sum = transactions
      .filter((t) => t.accountId === account.id)
      .reduce((total, t) => total + t.amountPence, 0);
    if (account.openingBalancePence + sum !== account.balancePence) {
      throw new Error(`Balance mismatch on ${account.name}`);
    }
  }
  const legs = new Map<string, Pence>();
  for (const t of transactions) {
    if (t.transferId) legs.set(t.transferId, (legs.get(t.transferId) ?? 0) + t.amountPence);
  }
  for (const [id, net] of legs) {
    if (net !== 0) throw new Error(`Transfer ${id} does not net to zero`);
  }
}

// ---------- small helpers ----------

function makeCustomer(): Customer {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName, provider: "example.com" }).toLowerCase(),
  };
}

function makePayees(): Payee[] {
  const people: Payee[] = Array.from({ length: 9 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    type: "person" as const,
    sortCode: makeSortCode(),
    accountNumber: faker.string.numeric(8),
  }));
  const businesses: Payee[] = Array.from({ length: 3 }, () => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: "business" as const,
    sortCode: makeSortCode(),
    accountNumber: faker.string.numeric(8),
  }));
  return [...people, ...businesses];
}

function makeAccount(customerId: string, type: AccountType, name: string, openingBalancePence: Pence): Account {
  return {
    id: faker.string.uuid(),
    customerId,
    type,
    name,
    sortCode: makeSortCode(),
    accountNumber: faker.string.numeric(8),
    currency: "GBP",
    openingBalancePence,
    balancePence: openingBalancePence, // filled in properly once transactions are applied
  };
}

function makeSortCode(): string {
  return [faker.string.numeric(2), faker.string.numeric(2), faker.string.numeric(2)].join("-");
}

function single(
  accountId: string,
  date: string,
  description: string,
  category: Category,
  kind: TransactionKind,
  amountPence: Pence,
): Draft {
  assertPence(amountPence);
  return { id: faker.string.uuid(), accountId, date, description, category, kind, amountPence };
}

/** Double entry: one move, two legs (money out of one account, the same amount into the other). */
function transfer(
  fromId: string,
  toId: string,
  amountPence: Pence,
  date: string,
  description: string,
  category: Category,
  kind: TransactionKind,
): [Draft, Draft] {
  assertPence(amountPence);
  const transferId = faker.string.uuid();
  return [
    { id: faker.string.uuid(), accountId: fromId, date, description, category, kind, amountPence: -amountPence, transferId },
    { id: faker.string.uuid(), accountId: toId, date, description, category, kind, amountPence, transferId },
  ];
}

function monthsInWindow(): { year: number; month: number }[] {
  const months = [];
  const cursor = new Date(Date.UTC(WINDOW_START.getUTCFullYear(), WINDOW_START.getUTCMonth(), 1));
  while (cursor < REF_DATE) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

/** ISO date for 09:00 UTC on that day, or null if it falls outside the history window. */
function monthDay(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month, day, 9, 0, 0));
  return date >= WINDOW_START && date < REF_DATE ? date.toISOString() : null;
}

function byDateThenId(a: { date: string; id: string }, b: { date: string; id: string }): number {
  // ISO strings sort correctly as text; the id breaks ties so the order is always the same.
  return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}
