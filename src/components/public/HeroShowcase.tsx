"use client";

import { useState } from "react";
import { ChartCandlestick, Coins, CreditCard, Smartphone, type LucideIcon } from "lucide-react";
import { formatGBP, roundUp } from "@/lib/money";
import type { Card } from "@/types/bank";
import { Money } from "@/components/ui/Money";
import { PaymentCard } from "@/components/ui/PaymentCard";

/** A sample card for the picture: a published TEST number's last 4 digits, a placeholder name. */
const SAMPLE_CARD: Card = {
  id: "sample",
  accountId: "sample",
  brand: "Visa",
  nameOnCard: "Your name",
  last4: "4242",
  expiryMonth: 9,
  expiryYear: 2030,
  frozen: false,
};

const VIEWS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "app", label: "App", icon: Smartphone },
  { id: "roundups", label: "Round-ups", icon: Coins },
  { id: "markets", label: "Markets", icon: ChartCandlestick },
];

/**
 * The big picture in the hero, with a rail of thumbnails to switch it (like the product rail in the
 * design reference). Buttons with aria-pressed: each says whether it's the one showing.
 * All figures are illustrations made from fake data.
 */
export function HeroShowcase() {
  const [view, setView] = useState("card");

  return (
    <div className="order-2 flex flex-col-reverse gap-6 lg:order-1 lg:flex-row lg:items-center">
      <ul aria-label="Choose what to preview" className="flex justify-center gap-2 sm:gap-3 lg:flex-col">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className="flex w-16 flex-col items-center gap-1.5 rounded-2xl sm:w-[4.5rem] border border-line bg-surface-2/70 px-2 py-3 text-xs font-medium text-muted transition-colors hover:text-foreground aria-pressed:border-accent aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1px_var(--accent)]"
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              {label}
            </button>
          </li>
        ))}
      </ul>

      {/* Re-keyed on each switch, so the new view plays the short entrance animation. */}
      <div aria-live="polite" className="grid min-h-[19rem] flex-1 place-items-center [perspective:1200px] sm:min-h-[22rem]">
        <div key={view} className="rise-in w-full max-w-sm">
          {view === "card" && (
            <div className="sm:motion-safe:[transform:rotateY(-14deg)_rotateX(8deg)] [transform-style:preserve-3d]">
              <PaymentCard card={SAMPLE_CARD} />
              <p className="mt-4 text-center text-sm text-muted">A Sterl debit card. Freeze it, and unfreeze it, in one tap.</p>
            </div>
          )}
          {view === "app" && <PhonePreview />}
          {view === "roundups" && <RoundUpPreview />}
          {view === "markets" && <MarketsPreview />}
        </div>
      </div>
    </div>
  );
}

function PhonePreview() {
  const accounts = [
    { name: "Everyday Account", pence: 120_000 },
    { name: "Rainy Day Saver", pence: 485_000 },
    { name: "Round-up Pot", pence: 26_165 },
  ];
  return (
    <div className="mx-auto w-60 rounded-[2.2rem] border-4 border-surface-2 bg-background p-3 shadow-2xl">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-surface-2" aria-hidden="true" />
      <div className="rounded-2xl hero-gold p-4">
        <p className="eyebrow opacity-80">Total balance</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          <Money pence={631_165} />
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {accounts.map((a) => (
          <li key={a.name} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-xs">
            <span className="font-medium">{a.name}</span>
            <Money pence={a.pence} className="font-semibold" />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[0.65rem] text-muted">Sample figures. All data is fake.</p>
    </div>
  );
}

function RoundUpPreview() {
  const spend = 347; // £3.47
  const saved = roundUp(spend); // the same function the bank uses: 53p
  return (
    <div className="panel flex flex-col items-center gap-4 rounded-3xl p-6 text-center">
      <div aria-hidden="true" className="relative h-24 w-32">
        <span className="orb absolute bottom-0 left-2 h-16 w-16" />
        <span className="orb absolute bottom-2 left-12 h-20 w-20" />
        <span className="orb absolute right-0 bottom-0 h-12 w-12" />
      </div>
      <p className="text-sm text-muted">Coffee for {formatGBP(spend)}, rounded up to {formatGBP(spend + saved)}</p>
      <p className="text-3xl font-semibold text-heading">{formatGBP(saved)} saved</p>
      <p className="text-sm text-muted">The change goes into your Round-up Pot, automatically.</p>
    </div>
  );
}

function MarketsPreview() {
  // A made-up price line, drawn as SVG. Labelled as simulated, like the real FX desk.
  const points = [12, 18, 15, 22, 20, 28, 25, 31, 27, 34, 30, 38];
  const path = points.map((y, i) => `${i * 20},${50 - y}`).join(" ");
  return (
    <div className="panel flex flex-col gap-3 rounded-3xl p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">GBP / USD</p>
        <p className="text-sm font-semibold text-positive">+0.24%</p>
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">1.2734</p>
      <svg viewBox="0 0 220 50" className="h-20 w-full" aria-hidden="true">
        <polyline points={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-xs text-muted">Simulated prices, not for trading.</p>
    </div>
  );
}
