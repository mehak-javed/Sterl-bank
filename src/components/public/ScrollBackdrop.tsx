/**
 * The moving light behind the public website (idea from a scrolling landing page Mehak shared; Sterl's
 * own black and gold). Fixed behind the page: soft gold, amber and silver glows and faint light rings
 * that drift, grow and change mood as you scroll down: warm gold at the top, deep amber through the
 * middle, cooler silver by the footer.
 *
 * Pure CSS (globals.css, "Scroll backdrop"): the browser ties each animation's progress to the scroll
 * position itself (animation-timeline: scroll()), on the compositor, so there's no JavaScript scroll
 * listener and no jank. Only transform and opacity move. Decoration only: hidden from screen readers,
 * never catches clicks, switched off for "reduce motion" and high contrast.
 */
export function ScrollBackdrop() {
  return (
    <div aria-hidden="true" className="scroll-backdrop">
      <div className="sb-layer sb-glow-gold" />
      <div className="sb-layer sb-glow-amber" />
      <div className="sb-layer sb-glow-silver" />
      <svg className="sb-layer sb-rings" viewBox="-100 -100 200 200" fill="none">
        {[30, 48, 66, 84].map((r) => (
          <circle key={r} r={r} stroke="var(--sb-ring)" strokeWidth="0.25" />
        ))}
        {/* Faint rays, like light falling through the rings. */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 96} y2={Math.sin(a) * 96} stroke="var(--sb-ring)" strokeWidth="0.15" />;
        })}
      </svg>
      <div className="sb-layer sb-veil" />
    </div>
  );
}
