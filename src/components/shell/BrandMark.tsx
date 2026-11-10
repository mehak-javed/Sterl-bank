import Link from "next/link";

/**
 * The compact logo for headers and the sidebar: STERL in the logo's Roman capitals, BANKING spaced
 * out beneath, in the logo gold (theme-aware via text-gold-gradient: bright gold on dark, deep gold
 * on light, plain text in high contrast). The full ornamental logo is <Logo> (footer, login).
 *
 * Inside the bank it goes to the dashboard; on the public site, to the home page.
 */
export function BrandMark({ href = "/dashboard", label = "Sterl Banking, go to dashboard" }: { href?: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="group flex flex-col items-start rounded-lg leading-none">
      <span
        aria-hidden="true"
        className="text-gold-gradient text-[1.65rem] font-bold tracking-[0.04em]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        STERL
      </span>
      <span
        aria-hidden="true"
        className="mt-1 flex w-full items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.42em] text-heading"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        <span className="h-px flex-1 bg-current opacity-60" />
        BANKING
        <span className="h-px flex-1 bg-current opacity-60" />
      </span>
    </Link>
  );
}
