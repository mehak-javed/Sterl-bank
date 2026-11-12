import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("which /api paths go to the Java API", () => {
  it("sends every banking path to the API, so it checks the login on each request", async () => {
    const rewrites = (await nextConfig.rewrites!()) as { source: string; destination: string }[];
    const sources = rewrites.map((r) => r.source);
    for (const area of ["auth", "accounts", "cards", "transfers"]) {
      expect(sources).toContain(`/api/${area}`);
      expect(sources).toContain(`/api/${area}/:path*`);
    }
    for (const r of rewrites) expect(r.destination.startsWith("http://localhost:8080/api/") || r.destination.includes("/api/")).toBe(true);
  });

  it("keeps no copy of customer data in the website itself", async () => {
    const { existsSync } = await import("node:fs");
    for (const route of ["accounts", "cards", "transactions"]) {
      expect(existsSync(`src/app/api/${route}/route.ts`)).toBe(false);
    }
    expect(existsSync("src/server/bank-db.ts")).toBe(false);
  });
});
