import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { HelpQuestions } from "@/components/public/HelpQuestions";
import { CardPouch } from "@/components/public/CardPouch";
import { FloatingOrbs } from "@/components/public/FloatingOrbs";
import { PeopleStories } from "@/components/public/PeopleStories";
import { HighlightGrid, PROTECTIONS } from "@/components/public/SecurityHighlights";
import { SendMoneyShowcase } from "@/components/public/SendMoneyShowcase";

const STEPS = [
  { title: "Open an account", text: "Sign up in a minute with your name, email and a password." },
  { title: "Look around", text: "See balances, spending, your cards and recent activity at a glance." },
  { title: "Move some money", text: "Transfer between accounts or switch round-ups on and off, and watch it update." },
];

/**
 * The public home page: what anyone sees before logging in. A Server Component: static content sent
 * as plain HTML; only the "Meet our people" stories (PeopleStories) run in the browser.
 *
 * Look: a dark, restrained fintech landing page (Mehak's direction): near-black page, matte-silver
 * text, gold accents. Sections: hero ("Work that matters, every single day") with the card pouch, send money,
 * "Meet our people" stories, how it works, security, help. The header's Meet our community
 * and Help links scroll to these sections; the full /security and /help pages stay as their own pages.
 * Layout ideas from references Mehak shared; Sterl's own
 * name and words. The team members and their stories are fictional; the photos are Unsplash stock
 * photos of models, credited on the page.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------- Hero: message left, card pouch right ---------- */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate grid items-center gap-10 px-4 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:px-12"
      >
        <FloatingOrbs />

        <div>
          <h1 id="hero-heading" className="text-5xl leading-[1.04] font-semibold tracking-tight sm:text-6xl xl:text-7xl">
            <span className="wipe-in block">Work that matters,</span>
            <span className="wipe-in-late text-gold-gradient block">every single day</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            At Sterl there&apos;s a place for everyone: room to learn, room to grow, and the chance to make a
            real difference for the people we serve, wherever they are.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 text-base font-semibold shadow-lg"
            >
              Open an account <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-base font-semibold hover:bg-surface-2"
            >
              <PlayCircle aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              See how it works
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <CardPouch />
        </div>
      </section>

      {/* ---------- Send money, analytics, budgeting, accounts ---------- */}
      <SendMoneyShowcase />

      {/* ---------- Meet our people ---------- */}
      <section id="people" aria-labelledby="stories-heading" className="mt-32 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <h2 id="stories-heading" className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Meet our <span className="text-gold-gradient">people</span>
        </h2>
        <div className="mt-12">
          <PeopleStories />
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" aria-labelledby="how-heading" className="mt-32 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <h2 id="how-heading" className="mt-2 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          See Sterl in a minute
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
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

      {/* ---------- Security (the full page, with confidentiality, is /security) ---------- */}
      <section id="security" aria-labelledby="security-heading" className="mt-32 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <h2 id="security-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Your money, <span className="text-gold-gradient">protected</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">What protects every Sterl account, in plain words.</p>
        <div className="mt-10">
          <HighlightGrid items={PROTECTIONS} />
        </div>
        <Link href="/security" className="mt-8 inline-flex items-center gap-2 font-semibold text-heading">
          Security and confidentiality <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      {/* ---------- Help ---------- */}
      <section
        id="help"
        aria-labelledby="help-heading"
        className="mt-32 grid w-full scroll-mt-28 grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:px-12"
      >
        <h2 id="help-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Questions, <span className="text-gold-gradient">answered</span>
        </h2>
        <HelpQuestions />
      </section>
    </>
  );
}
