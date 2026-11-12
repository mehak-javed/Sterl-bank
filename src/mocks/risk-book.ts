/**
 * Generates the Credit Risk desk's lending book: 500 invented companies, 2,000+ facilities and every
 * drawdown and repayment on them, as Flyway seed SQL (db/seed/V12__seed_risk_book.sql).
 *
 *   npm run seed:risk
 *
 * Deterministic: a fixed seed and a fixed "today" (REF_DATE) give byte-identical SQL every run, so CI
 * can check the committed file is up to date. It uses its own tiny random number generator rather than
 * Faker, so it runs with no installed packages (CI runs it before `npm ci`).
 *
 * Money is integer pence throughout (Number.isSafeInteger is checked on every amount). Company names are
 * built from invented word parts, never real companies.
 *
 * The book is shaped like a real one: most facilities comfortably inside their limit, some in the
 * warning band (75–100%), a few in breach (over 100%), some undrawn, a handful cancelled (limit 0),
 * and recent activity in the last week so "breaches this week" has something to show.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SEED = 4242; // its own seed: changing the customer data never changes the risk book
/** "Today" for the book. Same as src/mocks/generate.ts. */
const REF_DATE = new Date("2026-11-01T00:00:00.000Z");
const OUT = join(import.meta.dirname, "..", "..", "sterl-api", "src", "main", "resources", "db", "seed", "V12__seed_risk_book.sql");

export const COUNTERPARTIES = 500;
export const MIN_FACILITIES = 2_000;
const DAY_MS = 86_400_000;

// ---------- deterministic randomness ----------

/** mulberry32: a small, well-known seeded PRNG. Same seed, same sequence, on every machine. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
const random = mulberry32(SEED);
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
function weighted<T>(options: readonly (readonly [T, number])[]): T {
  const total = options.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [value, w] of options) {
    roll -= w;
    if (roll < 0) return value;
  }
  return options[options.length - 1][0];
}
/** A version-4-shaped UUID from the seeded generator (not crypto: these are fixed seed ids). */
function uuid(): string {
  const hex = Array.from({ length: 32 }, () => int(0, 15).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function pence(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Not whole, non-negative pence: ${value}`);
  return value;
}
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * DAY_MS);

// ---------- the book's shape ----------

const SECTORS = {
  Manufacturing: ["Components", "Engineering", "Precision Works", "Fabrication", "Industries"],
  Retail: ["Stores", "Retail", "Outfitters", "Home and Garden", "Marketplace"],
  "Real estate": ["Estates", "Property", "Developments", "Land", "Holdings"],
  Energy: ["Energy", "Power", "Renewables", "Grid Services", "Fuels"],
  Technology: ["Systems", "Software", "Data", "Networks", "Labs"],
  Healthcare: ["Health", "Care Homes", "Medical", "Clinics", "Life Sciences"],
  "Transport and logistics": ["Freight", "Logistics", "Haulage", "Shipping", "Couriers"],
  Hospitality: ["Hotels", "Inns", "Leisure", "Dining", "Resorts"],
  Construction: ["Construction", "Builders", "Civil Works", "Contractors", "Structures"],
  Agriculture: ["Farms", "Growers", "Agri", "Dairies", "Orchards"],
} as const;
type Sector = keyof typeof SECTORS;
const SECTOR_WEIGHTS: readonly (readonly [Sector, number])[] = [
  ["Manufacturing", 14], ["Retail", 11], ["Real estate", 15], ["Energy", 8], ["Technology", 12],
  ["Healthcare", 9], ["Transport and logistics", 10], ["Hospitality", 7], ["Construction", 9], ["Agriculture", 5],
];

/** Invented word parts: put together they make names like "Corvane Freight Ltd". */
const STEMS_A = ["Ard", "Bryn", "Cor", "Dun", "Elm", "Fen", "Gal", "Hal", "Ist", "Kes", "Lor", "Mar", "Nor", "Ost", "Pel", "Quen", "Rav", "Sel", "Tal", "Ul", "Vel", "Wyn", "Yar", "Zen"];
const STEMS_B = ["vane", "mere", "wick", "holt", "stead", "brook", "ridge", "ford", "gate", "moor", "wyn", "dell", "crest", "haven", "field"];
const LEGAL = ["Ltd", "PLC", "LLP", "Group"];

const COUNTRIES: readonly (readonly [string, number])[] = [
  ["GB", 62], ["IE", 7], ["NL", 6], ["DE", 6], ["FR", 5], ["ES", 4], ["US", 5], ["CA", 2], ["SG", 3],
];
/** Ratings, best to worst, with a typical corporate book's spread (most around BBB). */
const RATINGS: readonly (readonly [string, number])[] = [
  ["AAA", 2], ["AA", 6], ["A", 18], ["BBB", 34], ["BB", 22], ["B", 13], ["CCC", 5],
];
/** Riskier borrowers get smaller limits, in whole pounds (pence below). */
const LIMIT_POUNDS: Record<string, [number, number]> = {
  AAA: [5_000_000, 50_000_000], AA: [3_000_000, 40_000_000], A: [1_000_000, 25_000_000], BBB: [500_000, 15_000_000],
  BB: [250_000, 8_000_000], B: [250_000, 4_000_000], CCC: [100_000, 1_500_000],
};

/** How full a facility ends up, in basis points of its limit (10,000 = 100%). */
type Band = "undrawn" | "fine" | "warning" | "breach";
const BANDS: readonly (readonly [Band, number])[] = [["undrawn", 6], ["fine", 70], ["warning", 18], ["breach", 6]];
function targetBasisPoints(band: Band, rating: string): number {
  switch (band) {
    case "undrawn": return 0;
    case "fine": return int(500, 7_499);
    case "warning": return int(7_500, 10_000);
    // Weaker borrowers breach by more.
    case "breach": return int(10_001, rating === "CCC" || rating === "B" ? 13_500 : 11_500);
  }
}

// ---------- generate ----------

type Counterparty = { id: string; name: string; sector: Sector; country: string; rating: string };
type Facility = { id: string; counterpartyId: string; type: "term_loan" | "revolving_credit"; limitPence: number; openedOn: string; maturesOn: string };
type Movement = { id: string; facilityId: string; kind: "drawdown" | "repayment"; amountPence: number; occurredOn: string };

export function generateRiskBook() {
  const counterparties: Counterparty[] = [];
  const facilities: Facility[] = [];
  const movements: Movement[] = [];
  const names = new Set<string>();

  while (counterparties.length < COUNTERPARTIES) {
    const sector = weighted(SECTOR_WEIGHTS);
    const name = `${pick(STEMS_A)}${pick(STEMS_B)} ${pick(SECTORS[sector])} ${pick(LEGAL)}`;
    if (names.has(name)) continue; // names are unique (the database insists too)
    names.add(name);
    counterparties.push({ id: uuid(), name, sector, country: weighted(COUNTRIES), rating: weighted(RATINGS) });
  }

  let cancelled = 0;
  for (const cp of counterparties) {
    const count = int(3, 6); // 3–6 facilities each: 2,250 on average
    for (let i = 0; i < count; i++) {
      const type = random() < 0.55 ? "term_loan" : "revolving_credit";
      const opened = addDays(REF_DATE, -int(60, 5 * 365));
      const matures = addDays(opened, int(365, 7 * 365));
      const [lo, hi] = LIMIT_POUNDS[cp.rating];
      // Limits in whole thousands of pounds, like real credit approvals.
      let limitPence = pence(int(lo / 1_000, hi / 1_000) * 1_000 * 100);
      let band = weighted(BANDS);
      if (cancelled < 5 && random() < 0.01) {
        limitPence = 0; // a cancelled facility: no limit, nothing outstanding
        band = "undrawn";
        cancelled++;
      }
      const facility: Facility = { id: uuid(), counterpartyId: cp.id, type, limitPence, openedOn: isoDate(opened), maturesOn: isoDate(matures) };
      facilities.push(facility);

      const target = pence(Math.floor((limitPence * targetBasisPoints(band, cp.rating)) / 10_000));
      movements.push(...movementsFor(facility, opened, target));
    }
  }
  if (facilities.length < MIN_FACILITIES) throw new Error(`Only ${facilities.length} facilities`);
  return { counterparties, facilities, movements };
}

/**
 * Drawdowns and repayments that end EXACTLY at the target exposure and never go below zero.
 * Term loan: one big drawdown when it opens, then repayments down to the target.
 * Revolving credit: draws and repayments up and down, then one last movement to land on the target.
 */
function movementsFor(facility: Facility, opened: Date, target: number): Movement[] {
  const out: Movement[] = [];
  const span = Math.max(1, Math.floor((REF_DATE.getTime() - opened.getTime()) / DAY_MS) - 1);
  // Dates spread from opening to yesterday; about a quarter of facilities moved in the last week.
  const recent = random() < 0.25;
  const dates = Array.from({ length: 8 }, () => addDays(opened, int(0, span))).sort((a, b) => a.getTime() - b.getTime());
  if (recent) {
    // Never earlier than the movement before it: the last movement must stay last.
    const lastWeek = addDays(REF_DATE, -int(1, 6));
    const previous = dates[dates.length - 2];
    dates[dates.length - 1] = lastWeek > previous ? lastWeek : previous;
  }
  let balance = 0;
  const move = (amount: number, date: Date) => {
    if (amount === 0) return;
    balance += amount;
    if (balance < 0) throw new Error("A facility went below zero");
    out.push({ id: uuid(), facilityId: facility.id, kind: amount > 0 ? "drawdown" : "repayment", amountPence: amount, occurredOn: isoDate(date) });
  };

  if (facility.limitPence === 0 && target === 0) {
    return out; // cancelled before it was ever used
  }
  if (facility.type === "term_loan") {
    const initial = Math.max(target, Math.floor(facility.limitPence * (0.8 + random() * 0.2)));
    move(pence(initial), dates[0]);
    const repayments = int(1, 5);
    for (let i = 1; i <= repayments && balance > target; i++) {
      const isLast = i === repayments;
      const step = isLast ? balance - target : Math.floor(((balance - target) * int(10, 40)) / 100);
      move(-pence(step), dates[Math.min(i, dates.length - 1)]);
    }
  } else {
    const swings = int(2, 6);
    for (let i = 0; i < swings; i++) {
      const date = dates[Math.min(i, dates.length - 2)];
      if (balance > 0 && random() < 0.4) move(-pence(Math.floor((balance * int(10, 60)) / 100)), date);
      else move(pence(Math.floor((facility.limitPence * int(5, 35)) / 100)), date);
    }
  }
  move(target - balance, dates[dates.length - 1]); // land exactly on the target
  if (balance !== target) throw new Error("Missed the target exposure");
  return out;
}

// ---------- SQL ----------

const q = (value: string) => `'${value.replaceAll("'", "''")}'`;

function inserts(table: string, columns: string, rows: string[]): string {
  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += 500) {
    chunks.push(`INSERT INTO ${table} (${columns}) VALUES\n    ${rows.slice(i, i + 500).join(",\n    ")};\n`);
  }
  return chunks.join("\n");
}

export function toSql(book: ReturnType<typeof generateRiskBook>): string {
  const { counterparties, facilities, movements } = book;
  return [
    "-- V12: the Credit Risk desk's lending book. GENERATED by `npm run seed:risk` (src/mocks/risk-book.ts).",
    "-- Do not edit by hand: change the generator and run it again. CI fails if this file is out of date.",
    `-- ${counterparties.length} invented companies, ${facilities.length} facilities, ${movements.length} drawdowns and repayments.`,
    "-- Money in integer pence.",
    "",
    inserts("counterparties", "id, name, sector, country, rating",
      counterparties.map((c) => `(${q(c.id)}, ${q(c.name)}, ${q(c.sector)}, ${q(c.country)}, ${q(c.rating)})`)),
    inserts("facilities", "id, counterparty_id, type, limit_pence, opened_on, matures_on",
      facilities.map((f) => `(${q(f.id)}, ${q(f.counterpartyId)}, ${q(f.type)}, ${f.limitPence}, ${q(f.openedOn)}, ${q(f.maturesOn)})`)),
    inserts("drawdowns", "id, facility_id, kind, amount_pence, occurred_on",
      movements.map((m) => `(${q(m.id)}, ${q(m.facilityId)}, ${q(m.kind)}, ${m.amountPence}, ${q(m.occurredOn)})`)),
  ].join("\n");
}

// Run as a script (not when a test imports it).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const book = generateRiskBook();
  writeFileSync(OUT, toSql(book));
  console.log(`Wrote ${OUT}: ${book.counterparties.length} counterparties, ${book.facilities.length} facilities, ${book.movements.length} movements`);
}
