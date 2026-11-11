import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

/**
 * The public (logged-out) site: what anyone sees before logging in. A route group, like (bank):
 * it shares this layout without adding to the URL. Only fake, general information here; nothing
 * about any customer. (The demo notice is in PublicFooter, on every page.)
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
