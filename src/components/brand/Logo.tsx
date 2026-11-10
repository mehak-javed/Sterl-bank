import { useId } from "react";

/**
 * The full "STERL BANKING" logo, redrawn from Mehak's design as SVG so it stays sharp at any size
 * and follows the theme:
 *   dark: bright gold · light: deep gold (bright gold is unreadable on ivory) · high contrast: plain
 *   black or white. Colours come from the --logo-1 / --logo-2 tokens in globals.css.
 *
 * The swoosh sits BEHIND the letters and is drawn fainter, so it never cuts through the name.
 * role="img" + aria-label: screen readers hear "Sterl Banking" once, not a pile of shapes and letters.
 */
export function Logo({ className = "w-64" }: { className?: string }) {
  // Unique gradient ids: two logos on one page must not share (and fight over) the same id.
  const id = useId();
  const gold = `${id}-gold`;

  return (
    <svg viewBox="0 0 520 330" role="img" aria-label="Sterl Banking" className={className}>
      <defs>
        {/* userSpaceOnUse: the gradient spans the whole logo. The default (each shape's own box) breaks
            on the straight ornament lines: a horizontal line's box is 0 tall, so it painted nothing. */}
        <linearGradient id={gold} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="520" y2="330">
          <stop offset="0%" style={{ stopColor: "var(--logo-1)" }} />
          <stop offset="100%" style={{ stopColor: "var(--logo-2)" }} />
        </linearGradient>
      </defs>

      <g fill={`url(#${gold})`} stroke={`url(#${gold})`}>
        {/* Top ornament: rule, diamond ends, star medallion in the middle. */}
        <Ornament y={40} />

        {/* The swoosh: behind the letters, fainter, so the name stays easy to read. */}
        <path
          d="M78 118 C 30 150, 50 214, 150 214 C 270 214, 390 118, 492 70 C 400 104, 290 176, 165 190 C 92 198, 62 160, 78 118 Z"
          stroke="none"
          opacity="0.45"
        />

        {/* The name. Cinzel: Roman inscription capitals, close to the original lettering. */}
        <text
          x="260"
          y="182"
          textAnchor="middle"
          stroke="none"
          style={{ fontFamily: "var(--font-display), serif", fontWeight: 700, fontSize: 118, letterSpacing: "0.02em" }}
        >
          STERL
        </text>

        <Ornament y={232} />

        <text
          x="263"
          y="300"
          textAnchor="middle"
          stroke="none"
          style={{ fontFamily: "var(--font-display), serif", fontWeight: 600, fontSize: 46, letterSpacing: "0.42em" }}
        >
          BANKING
        </text>
      </g>
    </svg>
  );
}

/** A thin rule with diamond ends and a star in a circle, like the original's top and bottom lines. */
function Ornament({ y }: { y: number }) {
  return (
    <g strokeWidth="2.5" strokeLinecap="round">
      <line x1="70" y1={y} x2="232" y2={y} fill="none" />
      <line x1="288" y1={y} x2="450" y2={y} fill="none" />
      <path d={`M54 ${y} l10 -10 l10 10 l-10 10 Z`} stroke="none" />
      <path d={`M446 ${y} l10 -10 l10 10 l-10 10 Z`} stroke="none" />
      <circle cx="260" cy={y} r="17" fill="none" />
      {/* A four-pointed star inside the circle. */}
      <path d={`M260 ${y - 11} L263 ${y - 3} L271 ${y} L263 ${y + 3} L260 ${y + 11} L257 ${y + 3} L249 ${y} L257 ${y - 3} Z`} stroke="none" />
    </g>
  );
}
