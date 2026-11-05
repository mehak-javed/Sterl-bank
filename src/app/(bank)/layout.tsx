import type { ReactNode } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

/**
 * Wraps every banking page. "(bank)" is a route group: it shares this layout
 * but doesn't appear in the URL (/cards, not /bank/cards).
 * A layout stays mounted while you move between its pages, so the nav never re-renders from scratch.
 */
export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Skip link: keyboard users jump past the nav. Hidden until it gets focus. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-heading">
          Sterl
        </Link>
        <SiteNav />
      </header>

      {/* The one <main> per page lives here, so pages don't render their own. */}
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </>
  );
}
