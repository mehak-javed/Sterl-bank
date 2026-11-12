/*
 * Cookie consent, remembered in a first-party cookie for a year.
 * UK rules (PECR + UK GDPR, ICO guidance): strictly necessary cookies (login, security) need no
 * consent; anything optional (analytics, marketing) may only be set after "Accept", and rejecting
 * must be as easy as accepting. Sterl sets no optional cookies today; this records the choice so
 * any added later respect it.
 */

export const CONSENT_COOKIE = "sterl_consent";
export type Consent = "all" | "essential";

/** Reads the saved choice from a cookie string (document.cookie), or null if none yet. */
export function readConsent(cookies: string): Consent | null {
  const value = cookies
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  return value === "all" || value === "essential" ? value : null;
}

/** The Set-Cookie text for a choice: a year long, whole site, not sent to other sites. */
export function consentCookie(choice: Consent, secure: boolean): string {
  return `${CONSENT_COOKIE}=${choice}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Whether optional (non-essential) cookies may be used. */
export function allowsOptional(consent: Consent | null): boolean {
  return consent === "all";
}
