import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/.well-known/security.txt (RFC 9116)", () => {
  it("gives the contact and a FULL policy address, as the standard requires", async () => {
    const text = await GET(new Request("https://sterl.example/.well-known/security.txt")).text();
    expect(text).toContain("Contact: mailto:security@sterl.example");
    expect(text).toContain("Policy: https://sterl.example/security/policy");
  });

  it("hasn't expired, and expires within a year (this test fails when it's time to renew it)", async () => {
    const text = await GET(new Request("https://sterl.example/.well-known/security.txt")).text();
    const expires = new Date(/Expires: (.+)/.exec(text)![1]).getTime();
    const now = Date.now();
    expect(expires).toBeGreaterThan(now);
    expect(expires - now).toBeLessThan(366 * 24 * 60 * 60 * 1000);
  });
});
