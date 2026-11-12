import type { ReactNode } from "react";
import { Ellipsis, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { DisplaySettings } from "@/components/DisplaySettings";
import { SiteNav } from "@/components/SiteNav";
import { NAV_LINKS } from "@/lib/nav";
import { BrandMark } from "./BrandMark";
import { CustomerChip } from "./CustomerChip";
import { LogoutButton } from "./LogoutButton";
import { NavIcon } from "./NavIcon";
import { Sheet } from "./Sheet";

/**
 * The frame around every banking page.
 * - Desktop (lg and up): a fixed sidebar with every section, display settings and who's signed in.
 * - Phones: a slim top bar, and a bottom tab bar within thumb reach, like a banking app.
 * The page itself scrolls; the navigation stays put.
 * Who's logged in comes from the session (CustomerChip), and Log out ends it on the server.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const moreLinks = NAV_LINKS.filter((link) => !link.inTabBar);

  return (
    <div className="flex w-full flex-1">
      {/* Skip link: keyboard users jump past the navigation. Hidden until it gets focus. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      {/* ---------- Desktop sidebar ---------- */}
      <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r border-line px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-2">
          <BrandMark />
        </div>
        <nav aria-label="Main" className="flex-1">
          <SiteNav variant="sidebar" />
        </nav>
        <div className="flex flex-col gap-2">
          <Sheet
            title="Display settings"
            trigger={
              <>
                <SlidersHorizontal aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
                Display settings
              </>
            }
            triggerClassName="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <DisplaySettings />
          </Sheet>
          <LogoutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-60" />
          <CustomerChip variant="sidebar" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---------- Phone top bar ---------- */}
        <header className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <BrandMark />
          <CustomerChip variant="avatar" />
        </header>

        {/* The one <main> per page lives here, so pages don't render their own.
            pb-28 on phones: room for the tab bar, so it never covers the last thing on the page. */}
        <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col gap-6 px-4 pt-5 pb-28 lg:px-10 lg:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* ---------- Phone tab bar ---------- */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5">
          <div className="col-span-4">
            <SiteNav variant="tabbar" />
          </div>
          <Sheet
            title="More"
            trigger={
              <>
                <Ellipsis aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                More
              </>
            }
            triggerClassName="flex w-full flex-col items-center gap-1 py-2 text-[0.7rem] font-medium text-muted"
          >
            <ul className="flex flex-col gap-1">
              {moreLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 font-medium">
                    <NavIcon href={href} className="h-5 w-5 text-heading" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-4">
              <DisplaySettings />
            </div>
            <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-3 font-medium disabled:opacity-60" />
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
