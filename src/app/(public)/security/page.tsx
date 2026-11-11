import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  Download,
  Eye,
  FileLock2,
  Fingerprint,
  HandHeart,
  KeyRound,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Timer,
} from "lucide-react";

export const metadata: Metadata = { title: "Security and confidentiality" };

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

/**
 * How Sterl treats information. Every line must stay TRUE to what is built: planned items say "coming".
 * (Demo data is fake; the audit log is append-only in PostgreSQL; display settings live in the browser.)
 */
const CONFIDENTIALITY = [
  {
    icon: Database,
    title: "Only what's needed",
    text: "Sterl keeps only what running your account needs, and your display settings stay in your own browser.",
  },
  {
    icon: HandHeart,
    title: "Never sold, never shared",
    text: "Your information isn't sold, rented or passed to advertisers. Ever.",
  },
  {
    icon: FileLock2,
    title: "A record that can't be rewritten",
    text: "Every login and payment goes into an audit log that can only be added to, never edited or deleted.",
  },
  {
    icon: Download,
    title: "Your data, your choice (coming)",
    text: "Download a copy of everything Sterl holds about you, or close your account and have it removed.",
  },
];

export default function SecurityPage() {
  return (
    <div className="w-full px-4 pt-12 sm:px-8 lg:px-12">
      <p className="eyebrow text-muted">Security and confidentiality</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Your money and your data, <span className="text-gold-gradient">protected</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Here&apos;s what protects every Sterl account, and how we treat your information, in plain words.
      </p>

      <h2 className="mt-14 text-3xl font-semibold tracking-tight text-heading">Security</h2>

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROTECTIONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
            <span aria-hidden="true" className="chip h-11 w-11">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="confidentiality-heading" className="mt-20">
        <h2 id="confidentiality-heading" className="text-3xl font-semibold tracking-tight text-heading">
          Confidentiality
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONFIDENTIALITY.map(({ icon: Icon, title, text }) => (
            <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
              <span aria-hidden="true" className="chip h-11 w-11">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
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
        Want to see it for yourself?{" "}
        <Link href="/dashboard" className="font-semibold text-heading underline underline-offset-4">
          Take a tour
        </Link>
        .
      </p>
    </div>
  );
}
