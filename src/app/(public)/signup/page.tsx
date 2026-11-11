import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Sign up" };

/**
 * Placeholder until online account opening is built (Auth: a few non-sensitive details, then a new
 * account and card; no facial recognition, Mehak's decision of Nov 11). Until then it says it's
 * coming and offers the tour, like the Log in page.
 */
export default function SignUpPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-12 sm:px-6">
      <Logo className="w-56" />
      <div className="glass flex w-full flex-col gap-5 rounded-[2rem] p-8">
        <span aria-hidden="true" className="chip h-12 w-12">
          <UserPlus className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Open an account</h1>
          <p className="mt-2 text-muted">
            Opening an account online is coming soon: a few details, and your new account and card in
            minutes. Meanwhile, take a tour of the app.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-full btn-primary px-6 py-3.5 font-semibold"
        >
          Take a tour <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
        <p className="text-center text-sm text-muted">
          Already with Sterl?{" "}
          <Link href="/login" className="font-semibold text-heading underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
