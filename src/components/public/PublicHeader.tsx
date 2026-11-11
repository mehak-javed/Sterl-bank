import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import { Sheet } from "@/components/shell/Sheet";

export const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#people", label: "People" },
  { href: "/security", label: "Security" }, // footer: "Security and confidentiality"
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Log in and Sign up (Mehak's choice; "Try the demo" stays as the hero's main button).
              Both are compact on phones: logo + two buttons + menu must fit in 375px (at px-3 and gap-2
              the header measured 378px and clipped the menu button). */}
          <Link
            href="/login"
            className="rounded-full border border-line px-2.5 py-2 text-sm font-semibold whitespace-nowrap hover:bg-surface-2 sm:px-4"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full btn-primary px-2.5 py-2 text-sm font-semibold whitespace-nowrap sm:px-4"
          >
            Sign up
          </Link>
          <div className="md:hidden">
            <Sheet
              title="Menu"
              triggerLabel="Menu"
              trigger={<Menu aria-hidden="true" className="h-5 w-5" />}
              triggerClassName="chip h-10 w-10"
            >
              <ul className="flex flex-col gap-1">
                {[...PUBLIC_LINKS, { href: "/login", label: "Log in" }, { href: "/signup", label: "Sign up" }].map(({ href, label }) => (
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
