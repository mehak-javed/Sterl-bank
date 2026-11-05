import { connection } from "next/server";

/**
 * Makes our fake bank API behave like a real one over a real network:
 * a random delay, and about 1 request in 20 fails with "503 Service Unavailable".
 * That lets us build (and demo) proper loading, error and retry states.
 *
 * Set STERL_SIMULATE_NETWORK=off in .env.local to turn it off while debugging.
 */
const FAILURE_RATE = 0.05;
const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 1_000;

/** Returns an error Response to send back, or null to carry on normally. */
export async function simulateNetwork(): Promise<Response | null> {
  // Next.js 16 (Cache Components) would otherwise try to prerender GET handlers at build
  // time and serve one frozen response forever. connection() says "run on every request".
  await connection();

  if (process.env.STERL_SIMULATE_NETWORK === "off") return null;

  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < FAILURE_RATE) {
    return Response.json(
      { error: "The bank is busy right now. Please try again." },
      { status: 503, headers: { "Retry-After": "1" } },
    );
  }
  return null;
}
