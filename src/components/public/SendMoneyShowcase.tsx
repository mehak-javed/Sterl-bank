import Link from "next/link";
import { ArrowRight, ChartPie, ChevronDown, Landmark, PiggyBank } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { formatGBP } from "@/lib/money";

/*
 * Every figure here is the demo's own FAKE data (the same numbers the dashboard shows), in integer
 * pence like everywhere else in Sterl. The payee is the first fake payee from src/mocks/data.
 */
const SEND_AMOUNT = 12_000; // £120.00
const EVERYDAY_BALANCE = 125_000; // £1,250.00
const PAYEE = { name: "Raegan Rempel", initials: "RR" };

const ACCOUNTS = [
  { name: "Everyday Account", pence: 125_000 },
  { name: "Rainy Day Saver", pence: 480_000 },
];

/**
 * "Everyday money, made effortless": a public landing-page section. Left: a headline, short
 * paragraph and a gold button. Right: a picture of Sterl's send-money screen in a frosted-glass
 * frame over a gold horizon glow. Below: three feature cards (Analytics, Budgeting, Accounts),
 * each with a small preview of the app.
 *
 * The screen is a PICTURE, not a form: role="img" with one description, its contents hidden from
 * screen readers, and nothing in it is a real button or input (so nothing looks clickable that
 * isn't). The real send-money form is in the banking app.
 *
 * Layout idea from a Dribbble shot Mehak shared; Sterl's own black, gold and silver, words and data.
 */
export function SendMoneyShowcase() {
  return (
    <section id="send-money" aria-labelledby="send-heading" className="mt-24 w-full scroll-mt-28 px-4 sm:px-8 lg:px-12">
      <div className="text-center">
        <h2 id="send-heading" className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Everyday money,
          <span className="text-gold-gradient block">made effortless</span>
        </h2>
        <p className="mt-4 text-lg text-muted">Pay, save and keep track, all in one calm place.</p>
      </div>

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
        {/* Left: the message. */}
        <div>
          <h3 className="max-w-lg text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Send money in seconds, and never twice
          </h3>
          <p className="mt-4 max-w-lg text-lg text-muted">
            Choose who to pay, check the amount, confirm. Every payment is checked, recorded, and can only
            ever happen once, even if you tap twice.
          </p>
          <Link
            href="/dashboard#move-money"
            className="mt-8 inline-flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 font-semibold shadow-lg"
          >
            Try moving money <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>

        {/* Right: a picture of the send-money screen. */}
        <div
          role="img"
          aria-label={`Sterl's send money screen: sending ${formatGBP(SEND_AMOUNT)} from an Everyday Account with ${formatGBP(EVERYDAY_BALANCE)} to ${PAYEE.name}`}
          className="send-showcase relative overflow-hidden rounded-[2rem] border border-line p-6 sm:p-10"
        >
          <span aria-hidden="true" className="send-showcase-horizon" />
          <div aria-hidden="true" className="send-showcase-screen relative mx-auto max-w-sm rounded-3xl p-6">
            <p className="text-xl font-semibold text-heading">Send money</p>
            <p className="mt-1 text-sm text-muted">From your Everyday Account</p>

            <div className="mt-5 rounded-2xl border border-line bg-surface-2/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <Money pence={SEND_AMOUNT} className="text-3xl font-semibold" />
                <span className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold">
                  GBP <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">Balance: {formatGBP(EVERYDAY_BALANCE)}</p>
            </div>

            <p className="mt-5 text-sm text-muted">Who are you paying?</p>
            <div className="mt-2 flex items-center justify-between rounded-2xl border border-line bg-surface-2/70 px-4 py-3">
              <span className="flex items-center gap-3">
                <span className="chip h-8 w-8 rounded-full text-xs font-semibold">{PAYEE.initials}</span>
                <span className="font-medium">{PAYEE.name}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </div>

            <span className="mt-6 block rounded-full btn-primary py-3 text-center font-semibold">Confirm and send</span>
          </div>
        </div>
      </div>

      {/* Three feature cards, each with a small preview of the app (pictures; fake data). */}
      <ul className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        <li className="panel flex flex-col rounded-3xl p-6 text-center">
          <ChartPie aria-hidden="true" className="mx-auto h-6 w-6 text-heading" strokeWidth={1.75} />
          <h3 className="mt-3 text-xl font-semibold">Analytics</h3>
          <p className="mt-2 text-sm text-muted">See where your money goes each month, category by category.</p>
          <div aria-hidden="true" className="send-showcase-mini mt-6 rounded-2xl p-4 text-left text-sm">
            <p className="flex justify-between">
              <span>Groceries</span>
              <span className="font-semibold">{formatGBP(84_856)}</span>
            </p>
            <span className="mt-2 block h-1.5 rounded-full bg-surface-2">
              <span className="block h-full w-[58%] rounded-full bg-[var(--accent)]" />
            </span>
          </div>
        </li>
        <li className="panel flex flex-col rounded-3xl p-6 text-center">
          <PiggyBank aria-hidden="true" className="mx-auto h-6 w-6 text-heading" strokeWidth={1.75} />
          <h3 className="mt-3 text-xl font-semibold">Budgeting</h3>
          <p className="mt-2 text-sm text-muted">Round-ups put your spare change aside with every card payment.</p>
          <div aria-hidden="true" className="send-showcase-mini mt-6 flex items-center justify-between rounded-2xl p-4 text-left text-sm">
            <span>
              <Money pence={26_165} className="block text-xl font-semibold" />
              <span className="text-xs text-muted">Saved in your Round-up Pot</span>
            </span>
            <span className="rounded-full border border-line px-2 py-0.5 text-xs font-semibold">+{formatGBP(53)}</span>
          </div>
        </li>
        <li className="panel flex flex-col rounded-3xl p-6 text-center">
          <Landmark aria-hidden="true" className="mx-auto h-6 w-6 text-heading" strokeWidth={1.75} />
          <h3 className="mt-3 text-xl font-semibold">Accounts</h3>
          <p className="mt-2 text-sm text-muted">Every account side by side, with your total balance at the top.</p>
          <div aria-hidden="true" className="send-showcase-mini mt-6 flex flex-col gap-2 rounded-2xl p-4 text-left text-sm">
            {ACCOUNTS.map(({ name, pence }) => (
              <p key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="font-semibold">{formatGBP(pence)}</span>
              </p>
            ))}
          </div>
        </li>
      </ul>
    </section>
  );
}
