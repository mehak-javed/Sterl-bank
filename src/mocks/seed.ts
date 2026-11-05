/**
 * `npm run seed`: writes the fake bank to src/mocks/data/*.json.
 * These files are committed, so everyone who clones the repo sees the same bank.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatGBP } from "@/lib/money";
import { generateBank } from "./generate";

const outDir = join(import.meta.dirname, "data");
const bank = generateBank();

mkdirSync(outDir, { recursive: true });
const files = {
  "customer.json": bank.customer,
  "accounts.json": bank.accounts,
  "transactions.json": bank.transactions,
  "payees.json": bank.payees,
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + "\n");
}

console.log(`Wrote ${Object.keys(files).length} files to src/mocks/data/`);
for (const a of bank.accounts) {
  const count = bank.transactions.filter((t) => t.accountId === a.id).length;
  console.log(`  ${a.name.padEnd(17)} ${formatGBP(a.balancePence).padStart(11)}  (${count} transactions)`);
}
