import { useId } from "react";
import { EAGLE_SRC } from "./Eagle";

/**
 * The full "STERL BANKING" logo, redrawn from Mehak's design as SVG so it stays sharp at any size
 * and follows the theme:
 *   dark: bright gold · light: deep gold (bright gold is unreadable on ivory) · high contrast: plain
 *   black or white. Colours come from the --logo-1 / --logo-2 tokens in globals.css.
 *
 * The eagle (Mehak's artwork, public/brand/eagle.png) crowns the name. Like <Eagle>, the PNG is only
 * a stencil (an SVG alpha mask), so the eagle takes the same theme gold as the letters.
 * The swoosh sits BEHIND the letters and is drawn fainter, so it never cuts through the name.
 * role="img" + aria-label: screen readers hear "Sterl Banking" once, not a pile of shapes and letters.
 */
export function Logo({ className = "w-64" }: { className?: string }) {
  // Unique gradient ids: two logos on one page must not share (and fight over) the same id.
  const id = useId();
  const gold = `${id}-gold`;
  const eagle = `${id}-eagle`;

  return (
    <svg viewBox="0 0 520 388" role="img" aria-label="Sterl Banking" className={className}>
      <defs>
        {/* userSpaceOnUse: the gradient spans the whole logo. The default (each shape's own box) breaks
            on the straight ornament lines: a horizontal line's box is 0 tall, so it painted nothing. */}
        <linearGradient id={gold} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="520" y2="388">
          <stop offset="0%" style={{ stopColor: "var(--logo-1)" }} />
          <stop offset="100%" style={{ stopColor: "var(--logo-2)" }} />
        </linearGradient>
        {/* mask-type alpha: only the PNG's transparency counts, not its tan colour. */}
        <mask id={eagle} maskUnits="userSpaceOnUse" x="0" y="0" width="520" height="388" style={{ maskType: "alpha" }}>
          <image href={EAGLE_SRC} x="150" y="6" width="220" height="135" />
        </mask>
      </defs>

      {/* The eagle: a gold rectangle seen through the eagle-shaped stencil. */}
      <rect x="150" y="6" width="220" height="135" fill={`url(#${gold})`} mask={`url(#${eagle})`} />

      {/* Everything under the eagle, moved down 58 units to make room for it. */}
      <g fill={`url(#${gold})`} stroke={`url(#${gold})`} transform="translate(0 58)">

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

/** A thin rule with diamond ends and a star in a circle, between STERL and BANKING. */
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
