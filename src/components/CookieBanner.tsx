"use client";

import { useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { consentCookie, readConsent, type Consent } from "@/lib/consent";

/*
 * The saved choice lives in a cookie, outside React. useSyncExternalStore reads it safely: on the
 * server (and the first browser render) it reports "already chosen", so the banner never flashes
 * and hydration matches; then it reads the real cookie in the browser.
 */
const listeners = new Set<() => void>();
const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

/**
 * The cookie banner: shown until the visitor chooses. "Accept all" and "Essential only" look the
 * same and sit side by side, because rejecting must be as easy as accepting (UK ICO guidance).
 */
export function CookieBanner() {
  const consent = useSyncExternalStore(
    subscribe,
    () => readConsent(document.cookie),
    () => "essential" as Consent, // server: render nothing
  );
  if (consent) return null;

  function choose(choice: Consent) {
    document.cookie = consentCookie(choice, location.protocol === "https:");
    listeners.forEach((notify) => notify());
  }

  return (
    <section
      aria-labelledby="cookie-heading"
      className="glass fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl p-5 sm:inset-x-6 sm:flex-row sm:items-center sm:p-6"
    >
      <Cookie aria-hidden="true" className="hidden h-8 w-8 shrink-0 text-heading sm:block" />
      <div className="flex-1 text-sm">
        <h2 id="cookie-heading" className="font-semibold">
          Cookies
        </h2>
        <p className="mt-1 text-muted">
          We use essential cookies to keep you logged in and secure. With your permission we&apos;d also use optional
          cookies to improve Sterl.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => choose("essential")} className="flex-1 rounded-full btn-secondary px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
          Essential only
        </button>
        <button type="button" onClick={() => choose("all")} className="flex-1 rounded-full btn-secondary px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
          Accept all
        </button>
      </div>
    </section>
  );
}
