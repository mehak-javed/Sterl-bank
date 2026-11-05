import { cacheLife } from "next/cache";
import { connection } from "next/server";
import fallbackRates from "@/mocks/data/fx-fallback.json";
import { normaliseFrankfurter, type ReferenceRate, type ReferenceRates } from "@/lib/fx";

const FRANKFURTER_URL = "https://api.frankfurter.dev/v2/rates?base=gbp";

/**
 * Fetches real central-bank reference rates, cached for about a day: the whole app
 * calls Frankfurter at most once a day, no matter how many visitors we have.
 *
 * If this throws, nothing is cached, so a failure is never remembered for a day.
 */
async function getLiveRates(): Promise<ReferenceRate[]> {
  "use cache";
  cacheLife("days");

  const res = await fetch(FRANKFURTER_URL, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  return normaliseFrankfurter(await res.json());
}

// GET /api/fx/reference → today's GBP reference rates, or our saved copy if the source is down.
export async function GET() {
  // Decide live-or-fallback per request (not once at build time). The expensive part,
  // the Frankfurter call, is still cached by getLiveRates above.
  await connection();

  try {
    const body: ReferenceRates = { base: "GBP", source: "live", rates: await getLiveRates() };
    return Response.json(body);
  } catch (error) {
    // Resilience: the FX desk keeps working on yesterday's numbers, and says so.
    console.warn("FX reference rates unavailable, serving fallback:", error);
    const body: ReferenceRates = { base: "GBP", source: "fallback", rates: fallbackRates as ReferenceRate[] };
    return Response.json(body);
  }
}
