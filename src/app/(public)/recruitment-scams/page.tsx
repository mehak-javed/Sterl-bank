import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Gift, Link2Off, MailWarning, MessageCircleQuestion, ShieldAlert, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Recruitment scams" };

/** Warning signs of a fake job offer, in Sterl's own words. */
const SIGNS = [
  {
    icon: MailWarning,
    title: "Unexpected messages",
    text: "A message out of the blue, or from an address that isn't @sterl.example. Free email accounts and chat apps are a red flag.",
  },
  {
    icon: MessageCircleQuestion,
    title: "No real job behind it",
    text: "Real recruiters name a specific role and can point you to its description. Vague \"opportunities\" usually aren't.",
  },
  {
    icon: Link2Off,
    title: "Your CV \"found\" somewhere odd",
    text: "Someone says they found your CV on a site you've never used, then pushes you to move quickly.",
  },
  {
    icon: Wallet,
    title: "Requests for money or data",
    text: "Fees for training, equipment or visas, or requests for your bank details, passport or National Insurance number.",
  },
  {
    icon: ShieldAlert,
    title: "Strange interview tools",
    text: "Interviews only by text chat, or links to video calls that don't come from our own invitations.",
  },
  {
    icon: Gift,
    title: "Too good to be true",
    text: "A big salary, little effort, and an offer before you've even spoken to anyone.",
  },
];

const NEVER = [
  "Contact you from a free email address or an unverified account",
  "Ask for money at any stage: not for training, equipment or checks",
  "Ask for your bank details, passport or National Insurance number while you apply",
  "Interview you only by text message or chat app",
  "Offer you a job without an interview",
];

/**
 * Recruitment scams (public): fake jobs in Sterl's name. Sterl's own words, based on the kind of
 * guidance real employers publish. Contact addresses use the reserved .example domain, which can
 * never belong to a real organisation.
 */
export default function RecruitmentScamsPage() {
  return (
    <div className="w-full px-4 pt-12 sm:px-8 lg:px-12">
      <h1 className="mt-2 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
        Recruitment <span className="text-gold-gradient">scams</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Thank you for your interest in working at Sterl. Sadly, criminals sometimes pose as well-known companies, using real
        names and official-looking letters to run sham interviews and offers. They&apos;re after your money or your personal
        details. Here&apos;s how to spot them.
      </p>

      <section aria-labelledby="signs-heading" className="mt-16">
        <h2 id="signs-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Warning signs
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNS.map(({ icon: Icon, title, text }) => (
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

      <section aria-labelledby="never-heading" className="panel mt-16 rounded-[2rem] p-6 sm:p-10">
        <h2 id="never-heading" className="text-2xl font-semibold text-heading sm:text-3xl">
          Sterl will never
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NEVER.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/60 p-4">
              <Ban aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="report-heading" className="mt-16 max-w-3xl">
        <h2 id="report-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Think it&apos;s a scam?
        </h2>
        <ol className="mt-6 flex flex-col gap-4 text-lg">
          <li>
            Don&apos;t reply, pay or share anything.{" "}
            <span className="text-muted">Keep the messages: they help an investigation.</span>
          </li>
          <li>
            Report it to the police.{" "}
            <span className="text-muted">If you&apos;ve lost money, tell your bank straight away too.</span>
          </li>
          <li>
            Tell us.{" "}
            <span className="text-muted">
              Forward it to <span className="text-heading">report.phishing@sterl.example</span> so we can warn
              others.
            </span>
          </li>
        </ol>
        <Link href="/careers#roles" className="mt-10 inline-flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 font-semibold">
          See our real openings <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}
