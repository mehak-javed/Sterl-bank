import { describe, expect, it } from "vitest";
import { allowsOptional, consentCookie, readConsent } from "./consent";

describe("cookie consent", () => {
  it("is unknown until the visitor chooses", () => {
    expect(readConsent("")).toBeNull();
    expect(readConsent("other=1; sterl_consent=nonsense")).toBeNull();
  });

  it("reads a saved choice among other cookies", () => {
    expect(readConsent("XSRF-TOKEN=x; sterl_consent=essential")).toBe("essential");
    expect(readConsent("sterl_consent=all")).toBe("all");
  });

  it("allows optional cookies only after Accept all", () => {
    expect(allowsOptional(null)).toBe(false);
    expect(allowsOptional("essential")).toBe(false);
    expect(allowsOptional("all")).toBe(true);
  });

  it("remembers the choice for a year, site-wide, and Secure on https", () => {
    expect(consentCookie("essential", true)).toBe("sterl_consent=essential; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
    expect(consentCookie("all", false)).not.toContain("Secure");
  });
});
