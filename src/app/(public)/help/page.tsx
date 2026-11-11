import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help" };

const QUESTIONS = [
  {
    q: "How do I open an account?",
    a: "Choose Sign up and enter your name, email and a password, or sign up with Google. It takes about a minute.",
  },
  {
    q: "How do round-ups work?",
    a: "Each card payment is rounded up to the next pound, and the difference moves into your Round-up Pot. Spend £3.47 and 53p is saved.",
  },
  {
    q: "Can I freeze my card?",
    a: "Yes, in one tap from the Cards page, and unfreeze it just as quickly if it turns up.",
  },
  {
    q: "Where do your exchange rates come from?",
    a: "Daily reference rates published by central banks. Prices on the markets desk are indicative and not for trading.",
  },
  {
    q: "What happens to my data?",
    a: "We keep only what running your account needs, and display settings like the theme stay in your own browser. See Security and confidentiality for more.",
  },
];

/**
 * Questions and answers. <details>/<summary>: the browser's own expanding sections, keyboard and
 * screen-reader friendly without any JavaScript.
 */
export default function HelpPage() {
  return (
    // Full width, in two columns on wide screens: the heading on the left, the answers on the right
    // (long lines are hard to read, so the answers never stretch across the whole screen).
    <div className="grid w-full grid-cols-1 gap-10 px-4 pt-12 sm:px-8 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:px-12">
      <div>
        <p className="eyebrow text-muted">Help</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Questions, <span className="text-gold-gradient">answered</span>
        </h1>
        <p className="mt-6 text-muted">
          Still curious?{" "}
          <Link href="/signup" className="font-semibold text-heading underline underline-offset-4">
            Open an account
          </Link>{" "}
          or read about{" "}
          <Link href="/security" className="font-semibold text-heading underline underline-offset-4">
            security
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="panel group rounded-2xl p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <span
                aria-hidden="true"
                className="chip h-8 w-8 shrink-0 text-lg transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
