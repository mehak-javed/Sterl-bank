/**
 * Gold spheres drifting behind the hero's cards, for depth and a soft glow.
 * Pure CSS (see the `orb` utility), no images. aria-hidden and pointer-events-none: pure decoration,
 * never in the way of a click or a screen reader. They stop moving for reduced-motion users and
 * disappear in high contrast.
 *
 * Rule: no sphere behind text. Measured earlier: a sphere behind "See how it works" dropped it to
 * 3.5:1 contrast. In this hero the text is on the LEFT, so every sphere sits on the right (card) side
 * or off the top edge. On phones the text and cards STACK, so the side sphere would land behind the
 * paragraph (seen on a 375px phone): it only shows from the lg breakpoint, where the columns sit side by side.
 */
export function FloatingOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="orb float-slow absolute -top-12 right-[34%] h-24 w-24 opacity-70 blur-[2px]" />
      <span className="orb float-slower absolute top-[24%] -right-14 hidden h-44 w-44 opacity-80 blur-[2px] lg:block" />
      <span className="orb float-slow absolute -bottom-24 right-[22%] h-56 w-56 opacity-45 blur-[8px]" />
    </div>
  );
}
