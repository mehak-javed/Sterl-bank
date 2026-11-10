import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PUBLIC_LINKS } from "./PublicHeader";

export function PublicFooter() {
  return (
    <footer className="mt-24 w-full border-t border-line px-4 py-10 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo className="w-44" />
          <p className="mt-3 text-sm text-muted">
            Sterl is a portfolio demo built to show how a bank&apos;s software works. It is not a real bank:
            there is no real money, no real customers and no real cards. All data is fake.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {PUBLIC_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-muted hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/dashboard" className="text-muted hover:text-foreground">
                Try the demo
              </Link>
            </li>
            <li>
              <a href="https://github.com/mehak-javed/Sterl-bank" className="text-muted hover:text-foreground">
                Source code
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
