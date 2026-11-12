import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { CONFIDENTIALITY, HighlightGrid, PROTECTIONS } from "@/components/public/SecurityHighlights";

export const metadata: Metadata = { title: "Security and confidentiality" };

export default function SecurityPage() {
  return (
    <div className="w-full px-4 pt-12 sm:px-8 lg:px-12">
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Your money and your data, <span className="text-gold-gradient">protected</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Here&apos;s what protects every Sterl account, and how we treat your information, in plain words.
      </p>

      <h2 className="mt-14 text-3xl font-semibold tracking-tight text-heading">Security</h2>

      <div className="mt-8">
        <HighlightGrid items={PROTECTIONS} />
      </div>

      <section aria-labelledby="confidentiality-heading" className="mt-20">
        <h2 id="confidentiality-heading" className="text-3xl font-semibold tracking-tight text-heading">
          Confidentiality
        </h2>
        <div className="mt-8">
          <HighlightGrid items={CONFIDENTIALITY} columns={2} />
        </div>
      </section>

      <div className="panel mt-12 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
          <span>
            Found a security problem? Please report it privately. The technical details are in the project&apos;s
            security policy.
          </span>
        </p>
        <a
          href="/security/policy"
          className="flex shrink-0 items-center gap-2 font-semibold text-heading"
        >
          Security policy <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-8 text-sm text-muted">
        Ready to join?{" "}
        <Link href="/signup" className="text-heading underline underline-offset-4">
          Open an account
        </Link>
        .
      </p>
    </div>
  );
}
