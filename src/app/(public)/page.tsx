import Link from "next/link";
import {
  ArrowRight,
  ChartPie,
  Coins,
  CreditCard,
  Fingerprint,
  Landmark,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { CardRange } from "@/components/public/CardRange";
import { FloatingOrbs } from "@/components/public/FloatingOrbs";
import { CardPouch } from "@/components/public/CardPouch";

/** The quick feature cards right under the hero. */
const QUICK_FEATURES = [
  { icon: ShieldCheck, title: "Bank-grade security", text: "Strong sign-in and protection on every request." },
  { icon: Coins, title: "Round-up savings", text: "Spare change from every card payment, saved." },
  { icon: Zap, title: "Instant transfers", text: "Money moves at once, and never twice." },
  { icon: ChartPie, title: "Spending insights", text: "Your month by category, at a glance." },
];

const FEATURES = [
  {
    icon: Landmark,
    title: "Every account in one place",
    text: "Your current account, savings and Round-up Pot side by side, with your total balance at the top.",
  },
  {
    icon: Coins,
    title: "Save without thinking",
    text: "Every card payment rounds up to the next pound, and the change moves into your Round-up Pot.",
  },
  {
    icon: ChartPie,
    title: "Know where it goes",
    text: "Your month's spending by category, from groceries to bills, so there are no surprises.",
  },
  {
    icon: CreditCard,
    title: "Your card, your rules",
    text: "Freeze and unfreeze your card in one tap if it goes missing, then carry on.",
  },
  {
    icon: Zap,
    title: "Money moves, exactly once",
    text: "Transfers between your accounts are instant, and a double tap can never send them twice.",
  },
  {
    icon: Fingerprint,
    title: "Built to keep you safe",
    text: "Strong passwords, sessions that end when you're idle, and protection on every request.",
  },
];

const STEPS = [
  { title: "Try the demo", text: "Open a ready-made demo account. No sign-up, no real details." },
  { title: "Look around", text: "See balances, spending, your card and recent activity, all with fake data." },
  { title: "Move some money", text: "Transfer between accounts or switch round-ups on and off, and watch it update." },
];

/**
 * The public home page: what anyone sees before logging in. A Server Component: static marketing
 * content, sent as plain HTML (the card animation is pure CSS, so no JavaScript is needed at all).
 *
 * Look: a dark, restrained fintech landing page (Mehak's direction, inspired by a Dribbble concept
 * she shared): a near-black page with matte-silver text, the message on the left, a metal card pouch on the
 * right that shows every card and quick feature cards under the hero.
 * Sterl's own name, black-and-gold brand, words and pictures.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------- Hero: message left, cards right ---------- */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate grid items-center gap-10 px-4 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:px-12"
      >
        <FloatingOrbs />

        <div>
          {/* A small gold badge, like the highlight badges in fintech landing pages. */}
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-semibold">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-heading" />
            New: the Premier Metal card
          </p>
          <h1 id="hero-heading" className="mt-6 text-5xl leading-[1.04] font-semibold tracking-tight sm:text-6xl xl:text-7xl">
            <span className="wipe-in block">Banking meets</span>
            <span className="wipe-in-late text-gold-gradient block">brilliance</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            A modern bank account that keeps up with you: every balance at a glance, savings that build
            themselves, and security you never have to think about.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 text-base font-semibold shadow-lg"
            >
              Try the demo <ArrowRight aria-hidden="true" className="h-5 w-5" />
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

        {/* The card pouch. */}
        <div className="relative mx-auto w-full max-w-xl">
          <CardPouch />
        </div>
      </section>

      {/* ---------- Quick feature cards, right under the hero ---------- */}
      <section aria-label="Highlights" className="mt-12 w-full px-4 sm:px-8 lg:px-12">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass flex items-start gap-4 rounded-3xl p-5">
              <span aria-hidden="true" className="chip h-11 w-11">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" aria-labelledby="features-heading" className="mt-24 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <p className="eyebrow text-muted">Features</p>
        <h2 id="features-heading" className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Everything you need, nothing you don&apos;t
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
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

      {/* ---------- Our cards: every card type the bank offers ---------- */}
      <section id="cards" aria-labelledby="cards-heading" className="mt-24 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <p className="eyebrow text-muted">Our cards</p>
        <h2 id="cards-heading" className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          A card for every part of your life
        </h2>
        <CardRange />
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" aria-labelledby="how-heading" className="mt-24 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
        <p className="eyebrow text-muted">How it works</p>
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

      {/* ---------- Security ---------- */}
      <section aria-labelledby="security-heading" className="mt-24 w-full px-4 sm:px-8 lg:px-12">
        <div className="panel grid gap-8 rounded-[2rem] p-8 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <span aria-hidden="true" className="chip h-14 w-14">
              <LockKeyhole className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2 id="security-heading" className="mt-5 text-3xl font-semibold tracking-tight text-heading">
              Protected like a real bank
            </h2>
            <p className="mt-3 text-muted">
              Sterl is a demo, but it&apos;s built with the protections a bank uses. Your data is fake; the
              engineering is real.
            </p>
            <Link href="/security" className="mt-6 inline-flex items-center gap-2 font-semibold text-heading">
              How Sterl keeps you safe <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Passwords stored only as strong one-way hashes",
              "You only ever see your own accounts",
              "Sessions end after 15 minutes of inactivity",
              "Every payment can only happen once",
              "Every login and payment is recorded",
              "Security scans on every code change",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-heading" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Final call to action: this page's one solid-gold block ---------- */}
      <section aria-labelledby="cta-heading" className="mt-24 w-full px-4 sm:px-8 lg:px-12">
        <div className="hero-gold flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to look around?
            </h2>
            <p className="mt-2 max-w-md font-medium opacity-80">
              Open the demo account: no sign-up, no real details, nothing to install.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-hero-button px-7 py-3.5 font-semibold text-hero-button-foreground"
          >
            Try the demo <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
