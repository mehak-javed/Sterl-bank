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
  Zap,
} from "lucide-react";
import { FloatingOrbs } from "@/components/public/FloatingOrbs";
import { HeroShowcase } from "@/components/public/HeroShowcase";

/** The four promises under the headline, in circles (like the feature row in the design reference). */
const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Bank-grade security" },
  { icon: Coins, label: "Round-up savings" },
  { icon: Zap, label: "Instant transfers" },
  { icon: ChartPie, label: "Spending insights" },
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
 * content, sent as plain HTML. Only the preview rail in the hero (HeroShowcase) runs in the browser.
 *
 * Layout and mood follow the design reference (a frosted-glass hero over floating metallic objects,
 * a two-tone headline, a row of feature circles, a pill button and a round "play" button), in
 * Sterl's own black and gold, with our own words and pictures.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section aria-labelledby="hero-heading" className="relative isolate px-4 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <FloatingOrbs />
        <div className="glass relative grid items-center gap-10 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr]">
          {/* A gold coin breaking over the card's top edge, for depth (like the floating watch in the reference). */}
          <span
            aria-hidden="true"
            className="orb float-slow pointer-events-none absolute -top-9 right-[14%] z-10 hidden h-20 w-20 place-items-center text-2xl font-bold text-[#2b220c]/70 sm:grid"
          >
            £
          </span>
          <HeroShowcase />

          {/* order-1 on phones: the message comes first; on desktop the picture sits on the left. */}
          <div className="order-1 lg:order-2">
            <p className="eyebrow flex items-center gap-3 text-muted">
              Personal banking <span aria-hidden="true" className="h-px w-10 bg-current" />
            </p>
            <h1 id="hero-heading" className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              <span className="wipe-in block">Banking meets</span>
              <span className="wipe-in-late text-gold-gradient block">brilliance</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              A calm, clear bank account: every balance at a glance, savings that build themselves, and
              security you never have to think about.
            </p>

            <ul className="mt-7 grid max-w-md grid-cols-4 gap-2">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 text-center text-xs font-medium">
                  <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface-2/70">
                    <Icon className="h-5 w-5 text-heading" strokeWidth={1.75} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 text-base font-semibold shadow-lg"
              >
                Try the demo <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
              <Link href="#how-it-works" className="flex items-center gap-3 text-sm font-semibold">
                <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full border border-line">
                  <PlayCircle className="h-5 w-5" strokeWidth={1.75} />
                </span>
                See how it works
              </Link>
            </div>
          </div>
        </div>
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
