import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/** The footer's links (Mehak's list). Separate from the header menu, which stays short. */
export const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/careers", label: "Careers" },
  { href: "/help", label: "Help" },
  { href: "/recruitment-scams", label: "Recruitment scams" },
  { href: "/security", label: "Security and confidentiality" },
  { href: "/cookies", label: "Cookies" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
] as const;

export function PublicFooter() {
  return (
    <footer className="mt-24 w-full border-t border-line px-4 py-10 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo className="w-44" />
          <p className="mt-3 text-sm text-muted">
            Sterl opened its new global headquarters, marking a major milestone in its investment in New York
            City and workspaces globally.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {FOOTER_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-muted hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
