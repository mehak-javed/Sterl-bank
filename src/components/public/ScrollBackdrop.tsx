import type { CSSProperties } from "react";

/**
 * The moving scene behind the public website (idea from a scrolling landing page Mehak shared; Sterl's
 * own black and gold). Modern and calm, never "space" (Mehak, Nov 12), but with real depth:
 * - wide soft washes of gold, amber and silver light that change mood as you scroll;
 * - two long ribbons of light that sway slowly and cross, like a modern gradient;
 * - translucent, gold-edged glass cards at different depths: they float gently, and near ones pass
 *   faster than far ones as you scroll (parallax), echoing Sterl's cards;
 * - a gold line chart that draws itself as you scroll down, with a soft glow beneath it;
 * - a faint grid, like a ledger, and now and then a band of light crossing like light on brushed metal.
 *
 * Pure CSS (globals.css, "Scroll backdrop"): scroll-linked layers use animation-timeline: scroll(), so
 * the browser drives them itself, with no JavaScript scroll listener. Decoration only: hidden from
 * screen readers, never catches clicks, still for "reduce motion", hidden in high contrast.
 */

/** Glass cards: position (vw/vh), width (px), tilt (deg), float cycle (s). Fixed, so every visit matches. */
const CARDS = {
  far: [
    { x: 6, y: 58, w: 190, r: -14, f: 19 },
    { x: 78, y: 12, w: 170, r: 11, f: 23 },
    { x: 62, y: 118, w: 200, r: -8, f: 21 },
  ],
  near: [
    { x: 84, y: 64, w: 250, r: -18, f: 16 },
    { x: -4, y: 128, w: 270, r: 15, f: 18 },
    { x: 40, y: 185, w: 230, r: -10, f: 20 },
  ],
} as const;

/** A rising price-style line: gentle steps up with a few dips, across a 1000 × 300 box. */
const CHART_POINTS = [
  [0, 260], [60, 248], [110, 255], [170, 230], [230, 236], [290, 210], [350, 218], [410, 190],
  [470, 198], [530, 168], [590, 176], [650, 150], [710, 160], [770, 128], [830, 136], [890, 104],
  [950, 110], [1000, 86],
] as const;
const CHART_LINE = CHART_POINTS.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
const CHART_AREA = `${CHART_LINE} L 1000 300 L 0 300 Z`;

function Cards({ depth }: { depth: "far" | "near" }) {
  return (
    <div className={`sb-layer sb-depth sb-depth-${depth}`}>
      {CARDS[depth].map((c, i) => (
        <span
          key={i}
          className="sb-card"
          style={{ left: `${c.x}vw`, top: `${c.y}vh`, width: c.w, "--sb-r": `${c.r}deg`, "--sb-f": `${c.f}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function ScrollBackdrop() {
  return (
    <div aria-hidden="true" className="scroll-backdrop">
      <div className="sb-layer sb-grid" />
      <div className="sb-layer sb-wash-gold" />
      <div className="sb-layer sb-wash-amber" />
      <div className="sb-layer sb-wash-silver" />
      <div className="sb-layer sb-ribbon sb-ribbon-1" />
      <div className="sb-layer sb-ribbon sb-ribbon-2" />
      <div className="sb-layer sb-veil" />
      <Cards depth="far" />
      <svg className="sb-layer sb-chart" viewBox="0 0 1000 300" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="sb-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(212 175 55)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(212 175 55)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="sb-chart-area" d={CHART_AREA} fill="url(#sb-chart-fill)" />
        <path className="sb-chart-line" d={CHART_LINE} pathLength={1} />
      </svg>
      <Cards depth="near" />
      <div className="sb-layer sb-sweep" />
    </div>
  );
}
