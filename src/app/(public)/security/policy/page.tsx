import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Ban, BadgeCheck, Bug, CheckCircle2, Mail, Scale, Target } from "lucide-react";

export const metadata: Metadata = { title: "Security policy" };

/** The reporting address. The reserved .example domain can never belong to anyone else. */
const SECURITY_EMAIL = "security@sterl.example";

const IN_SCOPE = ["The Sterl website and its pages", "The Sterl app and your account screens", "Sterl's APIs and login"];
const OUT_OF_SCOPE = [
  "Tricking or phishing our staff or customers",
  "Physical attacks on offices or data centres",
  "Denial of service, or flooding us with traffic",
  "Services run by other companies",
  "Missing best-practice headers with no real impact",
];
const PLEASE = [
  "Only use accounts you own, and never view, change or delete anyone else's data",
  "Stop and tell us as soon as you find a problem; don't dig further",
  "Don't slow the service down for others",
  "Give us time to fix it before telling anyone else",
];
const STEPS = [
  { title: "We reply", text: "Within 2 working days, to say we've received your report." },
  { title: "We assess", text: "Within 5 working days, with our view of how serious it is." },
  { title: "We fix", text: "As fast as the risk demands, keeping you updated as we go." },
  { title: "We credit you", text: "With your permission, by name, once it's fixed." },
];

/**
 * Sterl's vulnerability disclosure policy, as a designed page (it replaces the link to the
 * repository's SECURITY.md). Structured like the disclosure policies banks publish: how to report,
 * scope, rules, our response times, and a safe-harbour promise. Its machine-readable twin is
 * /.well-known/security.txt (RFC 9116).
 */
export default function SecurityPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-8">
      <Link href="/security" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Security and confidentiality
      </Link>
      <p className="eyebrow mt-8 text-muted">Security policy</p>
      <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
        Found a security <span className="text-gold-gradient">problem?</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        We welcome reports from security researchers and customers alike. If you think you&apos;ve found a weakness in
        Sterl, please tell us privately, and we&apos;ll work with you to fix it.
      </p>

      {/* How to report */}
      <section aria-labelledby="report-heading" className="panel mt-12 rounded-[2rem] p-6 sm:p-10">
        <h2 id="report-heading" className="flex items-center gap-3 text-2xl font-semibold text-heading sm:text-3xl">
          <Mail aria-hidden="true" className="h-7 w-7 shrink-0" /> How to report
        </h2>
        <p className="mt-4 text-lg">
          Email <span className="font-semibold text-heading">{SECURITY_EMAIL}</span> with:
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "What the problem is, and where (the page or address)",
            "The steps to reproduce it",
            "What an attacker could do with it",
            "How we can reach you",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/60 p-4">
              <Bug aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Please don&apos;t include anyone else&apos;s personal information in your report.
        </p>
      </section>

      {/* Scope */}
      <section aria-labelledby="scope-heading" className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
        <h2 id="scope-heading" className="sr-only">
          Scope
        </h2>
        <div className="panel rounded-3xl p-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <Target aria-hidden="true" className="h-5 w-5 text-heading" /> In scope
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {IN_SCOPE.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-heading" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel rounded-3xl p-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <Ban aria-hidden="true" className="h-5 w-5 text-heading" /> Out of scope
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {OUT_OF_SCOPE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted">
                <Ban aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rules */}
      <section aria-labelledby="please-heading" className="mt-16">
        <h2 id="please-heading" className="text-3xl font-semibold tracking-tight text-heading">
          When you test, please
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLEASE.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-line p-4">
              <BadgeCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" /> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Our response */}
      <section aria-labelledby="response-heading" className="mt-16">
        <h2 id="response-heading" className="text-3xl font-semibold tracking-tight text-heading">
          What happens next
        </h2>
        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
              <span aria-hidden="true" className="text-gold-gradient text-4xl font-semibold">
                0{i + 1}
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Safe harbour */}
      <section aria-labelledby="harbour-heading" className="panel mt-16 flex flex-col gap-4 rounded-[2rem] p-6 sm:flex-row sm:p-10">
        <Scale aria-hidden="true" className="h-8 w-8 shrink-0 text-heading" />
        <div>
          <h2 id="harbour-heading" className="text-2xl font-semibold text-heading">
            Our promise to you
          </h2>
          <p className="mt-3 text-muted">
            If you act in good faith and follow this policy, we won&apos;t take legal action against you for your
            research, and we&apos;ll treat your report as the help it is.
          </p>
        </div>
      </section>
    </div>
  );
}
