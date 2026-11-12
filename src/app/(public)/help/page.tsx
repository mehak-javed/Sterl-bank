import type { Metadata } from "next";
import Link from "next/link";
import { HelpQuestions } from "@/components/public/HelpQuestions";

export const metadata: Metadata = { title: "Help" };

/**
 * Questions and answers (the same ones as the home page's Help section).
 */
export default function HelpPage() {
  return (
    // Full width, in two columns on wide screens: the heading on the left, the answers on the right
    // (long lines are hard to read, so the answers never stretch across the whole screen).
    <div className="grid w-full grid-cols-1 gap-10 px-4 pt-12 sm:px-8 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:px-12">
      <div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Questions, <span className="text-gold-gradient">answered</span>
        </h1>
        <p className="mt-6 text-muted">
          Still curious?{" "}
          <Link href="/signup" className="text-heading underline underline-offset-4">
            Open an account
          </Link>{" "}
          or read about{" "}
          <Link href="/security" className="text-heading underline underline-offset-4">
            security
          </Link>
          .
        </p>
      </div>

      <HelpQuestions />
    </div>
  );
}
