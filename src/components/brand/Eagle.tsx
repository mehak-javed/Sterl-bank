/** Where the eagle's shape lives (a transparent PNG). Used as a stencil, never shown as a picture. */
export const EAGLE_SRC = "/brand/eagle.png";

/**
 * The Sterl eagle. The PNG is used as a MASK (a stencil): only its shape is taken, and the colour
 * comes from CSS. So one file gives bright gold on dark, deep gold on light (the file's own tan is
 * barely visible on ivory), black or white in high contrast, and the card's gold on payment cards.
 *
 * Decorative: aria-hidden, because the name next to it ("Sterl Banking", "STERL") is what a screen
 * reader should hear. Size it with a width or height class; the aspect ratio is fixed (378 × 232).
 */
export function Eagle({ className = "", tone = "logo" }: { className?: string; tone?: "logo" | "card" }) {
  return <span aria-hidden="true" className={`eagle-mark ${tone === "card" ? "eagle-on-card" : ""} ${className}`} />;
}
