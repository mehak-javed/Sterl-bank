import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Log in" };

/**
 * Placeholder until the website's login is built (Auth story A2). The Java API already has real login;
 * this page will post to it. Until then it says so honestly and points to the demo.
 */
export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-12 sm:px-6">
      <Logo className="w-56" />
      <div className="glass w-full flex flex-col gap-5 rounded-[2rem] p-8">
        <span aria-hidden="true" className="chip h-12 w-12">
          <LockKeyhole className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-2 text-muted">
            Online login is on its way: a password, then Face ID, Touch ID or an authenticator app. Until
            then, the demo account shows everything.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-full btn-primary px-6 py-3.5 font-semibold"
        >
          Try the demo <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
        <p className="text-center text-xs text-muted">Never enter real details anywhere in Sterl. All data is fake.</p>
      </div>
    </div>
  );
}
