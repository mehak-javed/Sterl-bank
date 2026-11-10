/**
 * Gold spheres drifting behind the hero, like the floating objects in the design reference.
 * Pure CSS (see the `orb` utility), no images. aria-hidden and pointer-events-none: pure decoration,
 * never in the way of a click or a screen reader. They stop moving for reduced-motion users and
 * disappear in high contrast.
 */
export function FloatingOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="orb float-slow absolute -top-10 left-[6%] h-28 w-28 opacity-90 blur-[1px]" />
      <span className="orb float-slower absolute top-[18%] -right-10 h-44 w-44 opacity-80 blur-[2px]" />
      <span className="orb float-slow absolute bottom-[8%] -left-12 h-36 w-36 opacity-70 blur-[3px]" />
      {/* Kept behind the card picture, not the text: through see-through glass, a sphere behind words
          dropped "See how it works" to 3.5:1 contrast (measured). */}
      <span className="orb float-slower absolute -bottom-20 left-[30%] h-52 w-52 opacity-60 blur-[6px]" />
    </div>
  );
}
