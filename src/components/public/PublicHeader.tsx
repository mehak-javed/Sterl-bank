import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import { Sheet } from "@/components/shell/Sheet";

export const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#cards", label: "Cards" },
  { href: "/security", label: "Security" },
  { href: "/help", label: "Help" },
] as const;

/**
 * The top bar of the public (logged-out) site: a frosted-glass strip like the hero card below it.
 * Desktop: links in the middle, Log in + "Try the demo" on the right.
 * Phones: logo, "Try the demo", and a Menu sheet with the links.
 */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8 lg:px-12">
      <div className="glass flex items-center justify-between gap-2 rounded-2xl px-3 py-3 sm:gap-4 sm:px-5">
        <BrandMark href="/" label="Sterl home" />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-surface-2 sm:block">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-full btn-primary px-3 py-2 text-sm font-semibold whitespace-nowrap sm:px-4"
          >
            {/* The arrow is hidden on small phones: logo + button + menu must fit in 375px. */}
            Try the demo <ArrowRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
          </Link>
          <div className="md:hidden">
            <Sheet
              title="Menu"
              triggerLabel="Menu"
              trigger={<Menu aria-hidden="true" className="h-5 w-5" />}
              triggerClassName="chip h-10 w-10"
            >
              <ul className="flex flex-col gap-1">
                {[...PUBLIC_LINKS, { href: "/login", label: "Log in" }].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="block rounded-xl border border-line px-4 py-3 font-medium">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
