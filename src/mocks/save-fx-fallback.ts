/**
 * `npm run fx:fallback`: saves today's Frankfurter rates to src/mocks/data/fx-fallback.json.
 * The FX desk uses this copy whenever Frankfurter is unreachable. Re-run it now and then
 * so the fallback doesn't get too old.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { normaliseFrankfurter } from "@/lib/fx";

const FRANKFURTER_URL = "https://api.frankfurter.dev/v2/rates?base=gbp";

async function main() {
  const res = await fetch(FRANKFURTER_URL);
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const rates = normaliseFrankfurter(await res.json());

  const outFile = join(__dirname, "data", "fx-fallback.json");
  writeFileSync(outFile, JSON.stringify(rates, null, 2) + "\n");
  console.log(`Saved ${rates.length} reference rates to src/mocks/data/fx-fallback.json`);
}

// No top-level await: this project's scripts run as CommonJS, so we use an async main().
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
