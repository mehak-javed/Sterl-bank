import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScrollBackdrop } from "./ScrollBackdrop";

const css = readFileSync("src/app/globals.css", "utf8");
const backdropCss = css.slice(css.indexOf("/* ---------- Scroll backdrop"));

describe("the moving background", () => {
  const html = renderToStaticMarkup(<ScrollBackdrop />);

  it("is decoration only: hidden from screen readers, with no text or links", () => {
    expect(html).toMatch(/^<div aria-hidden="true" class="scroll-backdrop">/);
    expect(html).not.toMatch(/<a |<button|<p>/);
  });

  it("is on every public page and on log in / sign up", () => {
    for (const layout of ["src/app/(public)/layout.tsx", "src/app/(auth)/layout.tsx"]) {
      expect(readFileSync(layout, "utf8")).toContain("<ScrollBackdrop />");
    }
  });

  it("only moves for people who haven't asked for less motion", () => {
    // Every animation rule sits inside a no-preference block (or is the keyframes it uses).
    expect(backdropCss.match(/@media \(prefers-reduced-motion: no-preference\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(backdropCss).toContain("animation-timeline: scroll(root block)");
  });

  it("never catches clicks and goes away in high contrast", () => {
    expect(backdropCss).toMatch(/\.scroll-backdrop \{[^}]*pointer-events: none/);
    expect(backdropCss).toMatch(/\[data-contrast="high"\] \.scroll-backdrop \{\s*display: none/);
  });

  it("animates only transform and opacity (cheap for the browser), never layout", () => {
    const keyframes = backdropCss.match(/@keyframes sb-[\s\S]*?\n\}/g) ?? [];
    expect(keyframes.length).toBeGreaterThan(5);
    for (const block of keyframes) {
      // The one exception: the chart line "draws" by moving its dash, a cheap paint on one small path.
      const allowed = block.startsWith("@keyframes sb-chart-draw") ? ["stroke-dashoffset"] : ["transform", "opacity"];
      const properties = [...block.matchAll(/([a-z-]+):/g)].map((m) => m[1]);
      for (const property of properties) expect(allowed).toContain(property);
    }
  });

  it("is calm, not a space scene: no stars, orbits or planets", () => {
    expect(html).not.toMatch(/sb-speck|sb-rings|<circle|class="orb/);
  });
});
