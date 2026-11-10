import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Fingerprint, KeyRound, ListChecks, LockKeyhole, ShieldCheck, Timer } from "lucide-react";

export const metadata: Metadata = { title: "Security" };

const PROTECTIONS = [
  {
    icon: KeyRound,
    title: "Your password is never stored",
    text: "Only a one-way fingerprint of it (an Argon2id hash) is kept. Even Sterl can't read your password back.",
  },
  {
    icon: Eye,
    title: "You only ever see your own money",
    text: "Every request is checked against who is logged in. Someone else's account simply doesn't exist for you.",
  },
  {
    icon: Timer,
    title: "Idle sessions end",
    text: "Step away for 15 minutes and you're logged out on the server, not just in the browser.",
  },
  {
    icon: LockKeyhole,
    title: "Protection on every request",
    text: "Forged requests from other websites are refused, and the login cookie can't be read by page scripts.",
  },
  {
    icon: ListChecks,
    title: "Every payment happens exactly once",
    text: "A double tap or a dropped connection can never send money twice, and every movement is recorded.",
  },
  {
    icon: Fingerprint,
    title: "Face ID and Touch ID, coming next",
    text: "Your phone checks your face or fingerprint itself. Sterl only receives proof the check passed, never your face.",
  },
];

export default function SecurityPage() {
  return (
    <div className="w-full px-4 pt-12 sm:px-8 lg:px-12">
      <p className="eyebrow text-muted">Security</p>
      <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Your money, <span className="text-gold-gradient">protected</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Sterl is a portfolio demo with fake data, but it&apos;s engineered the way a bank is. Here&apos;s what
        protects every account, in plain words.
      </p>

      <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROTECTIONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
            <span aria-hidden="true" className="chip h-11 w-11">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>

      <div className="panel mt-12 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
          <span>
            Found a security problem? Please report it privately. The technical details are in the project&apos;s
            security policy.
          </span>
        </p>
        <a
          href="https://github.com/mehak-javed/Sterl-bank/blob/main/SECURITY.md"
          className="flex shrink-0 items-center gap-2 font-semibold text-heading"
        >
          Security policy <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-8 text-sm text-muted">
        Want to see it for yourself?{" "}
        <Link href="/dashboard" className="font-semibold text-heading underline underline-offset-4">
          Try the demo
        </Link>
        .
      </p>
    </div>
  );
}
