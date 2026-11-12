/**
 * `npm run seed:sql` (also run by `npm run seed`): turns the fake bank in src/mocks/data/*.json
 * into a Flyway migration for the Java API, so PostgreSQL holds exactly the same bank as the front end.
 *
 * Output: sterl-api/src/main/resources/db/seed/V2__seed_demo_bank.sql (committed, like the JSON).
 *
 * Double-entry: each front-end transaction is one leg. Transfers between the customer's own accounts
 * already have both legs (same transferId). Money that enters or leaves Sterl (card spending, salary,
 * direct debits) gets its other leg on one of the bank's internal accounts, created in V1.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FixtureAccount, Customer, Payee, Transaction } from "@/types/bank";

const dataDir = join(import.meta.dirname, "data");
const read = <T>(name: string): T => JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;

const customer = read<Customer>("customer.json");
const accounts = read<FixtureAccount[]>("accounts.json");
const payees = read<Payee[]>("payees.json");
const transactions = read<Transaction[]>("transactions.json");

/** Fixed ids of the internal accounts inserted by V1__ledger_schema.sql. */
const INTERNAL = {
  OPENING_BALANCES: "00000000-0000-4000-8000-000000000001",
  CARD_SETTLEMENT: "00000000-0000-4000-8000-000000000002",
  INBOUND_PAYMENTS: "00000000-0000-4000-8000-000000000003",
  OUTBOUND_PAYMENTS: "00000000-0000-4000-8000-000000000004",
} as const;

/** Where the other leg goes for money entering or leaving Sterl. */
const COUNTER_ACCOUNT: Partial<Record<Transaction["kind"], string>> = {
  card: INTERNAL.CARD_SETTLEMENT,
  salary: INTERNAL.INBOUND_PAYMENTS,
  direct_debit: INTERNAL.OUTBOUND_PAYMENTS,
  standing_order: INTERNAL.OUTBOUND_PAYMENTS,
};

/**
 * A stable UUID made from a name (same input = same UUID every run), formatted as a
 * version-5-style UUID. Keeps the generated SQL byte-identical between runs.
 */
function stableUuid(name: string): string {
  const h = createHash("sha1").update(`sterl:${name}`).digest("hex");
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** SQL string literal. Doubling single quotes is the only escape PostgreSQL needs here. */
const q = (value: string) => `'${value.replaceAll("'", "''")}'`;

type Leg = { id: string; accountId: string; amountPence: number };
type LedgerTx = { id: string; kind: string; description: string; category: string; occurredAt: string; legs: Leg[] };

const ledger: LedgerTx[] = [];

// 1. Opening balances: each account starts the 90-day window with its opening balance,
//    booked against the bank's OPENING_BALANCES account. Dated midnight UTC on the first day.
const firstDate = transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date);
const openingAt = `${firstDate.slice(0, 10)}T00:00:00.000Z`;
for (const a of accounts) {
  if (a.openingBalancePence === 0) continue;
  ledger.push({
    id: stableUuid(`opening:${a.id}`),
    kind: "opening_balance",
    description: "Opening balance",
    category: "Opening balance",
    occurredAt: openingAt,
    legs: [
      { id: stableUuid(`opening-leg:${a.id}`), accountId: a.id, amountPence: a.openingBalancePence },
      { id: stableUuid(`opening-contra:${a.id}`), accountId: INTERNAL.OPENING_BALANCES, amountPence: -a.openingBalancePence },
    ],
  });
}

// 2. Transfers between the customer's own accounts: group the two legs by transferId.
const transfers = new Map<string, Transaction[]>();
for (const t of transactions) {
  if (t.transferId) transfers.set(t.transferId, [...(transfers.get(t.transferId) ?? []), t]);
}
for (const [transferId, legs] of transfers) {
  const [first] = legs;
  ledger.push({
    id: transferId,
    kind: first.kind,
    description: first.description,
    category: first.category,
    occurredAt: first.date,
    legs: legs.map((t) => ({ id: t.id, accountId: t.accountId, amountPence: t.amountPence })),
  });
}

// 3. Money in or out of Sterl: the customer's leg plus a balancing leg on an internal account.
for (const t of transactions) {
  if (t.transferId) continue;
  const counter = COUNTER_ACCOUNT[t.kind];
  if (!counter) throw new Error(`No counter account for transaction kind "${t.kind}" (${t.id})`);
  ledger.push({
    id: t.id,
    kind: t.kind,
    description: t.description,
    category: t.category,
    occurredAt: t.date,
    legs: [
      { id: t.id, accountId: t.accountId, amountPence: t.amountPence },
      { id: stableUuid(`contra:${t.id}`), accountId: counter, amountPence: -t.amountPence },
    ],
  });
}

// Self-check before writing: every ledger transaction balances (the database checks again on commit).
for (const tx of ledger) {
  const total = tx.legs.reduce((sum, leg) => sum + leg.amountPence, 0);
  if (tx.legs.length < 2 || total !== 0) throw new Error(`Unbalanced ledger transaction ${tx.id}: ${total}`);
}

ledger.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));

// ---------- Write the SQL ----------

const lines: string[] = [];
lines.push(
  "-- =====================================================================================",
  "-- V2: the fake demo bank. GENERATED by `npm run seed:sql` from src/mocks/data/*.json.",
  "-- Do not edit by hand: change the generator and re-run it.",
  "-- Sterl is a portfolio demo. Not a real bank. All data is fake.",
  "-- =====================================================================================",
  "",
  "INSERT INTO customers (id, first_name, last_name, email) VALUES",
  `    (${q(customer.id)}, ${q(customer.firstName)}, ${q(customer.lastName)}, ${q(customer.email)});`,
  "",
  "INSERT INTO accounts (id, customer_id, type, name, sort_code, account_number, currency) VALUES",
  accounts
    .map((a) => `    (${q(a.id)}, ${q(a.customerId)}, ${q(a.type)}, ${q(a.name)}, ${q(a.sortCode)}, ${q(a.accountNumber)}, ${q(a.currency)})`)
    .join(",\n") + ";",
  "",
  "INSERT INTO payees (id, customer_id, name, type, sort_code, account_number) VALUES",
  payees
    .map((p) => `    (${q(p.id)}, ${q(customer.id)}, ${q(p.name)}, ${q(p.type)}, ${q(p.sortCode)}, ${q(p.accountNumber)})`)
    .join(",\n") + ";",
  "",
  `-- ${ledger.length} ledger transactions, ${ledger.reduce((n, tx) => n + tx.legs.length, 0)} entries.`,
  "INSERT INTO ledger_transactions (id, kind, description, category, occurred_at) VALUES",
  ledger
    .map((tx) => `    (${q(tx.id)}, ${q(tx.kind)}, ${q(tx.description)}, ${q(tx.category)}, ${q(tx.occurredAt)})`)
    .join(",\n") + ";",
  "",
  "INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence) VALUES",
  ledger
    .flatMap((tx) => tx.legs.map((leg) => `    (${q(leg.id)}, ${q(tx.id)}, ${q(leg.accountId)}, ${leg.amountPence})`))
    .join(",\n") + ";",
  "",
);

const outFile = join(import.meta.dirname, "../../sterl-api/src/main/resources/db/seed/V2__seed_demo_bank.sql");
writeFileSync(outFile, lines.join("\n"));
console.log(`Wrote ${ledger.length} ledger transactions to sterl-api/src/main/resources/db/seed/V2__seed_demo_bank.sql`);
