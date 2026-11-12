"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Which parts of a public page ease in: each page section below the hero. */
export const REVEAL_SELECTOR = ".public-site main > section, .public-site main > div > section";

/**
 * Sections fade and rise in as they're about to scroll into view (styles in globals.css, "reveal").
 *
 * - Only sections that start BELOW the window are hidden first, so nothing on screen ever blinks.
 * - One IntersectionObserver watches them all: the browser tells us when one comes near, instead of
 *   us checking positions on every scroll event (which would run hundreds of times a second).
 * - "Reduce motion": nothing is hidden or moved. No JavaScript: everything simply shows.
 */
export function ScrollReveal() {
  // Moving between public pages keeps this layout, so run again for each new page's sections.
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const below = [...document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)].filter(
      (section) => section.getBoundingClientRect().top > window.innerHeight,
    );
    if (below.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target as HTMLElement;
          section.classList.add("reveal-in");
          section.classList.remove("reveal-pending");
          observer.unobserve(section); // once is enough: it stays shown
        }
      },
      // Start a little before the section reaches the window, so it's already moving as it appears.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    for (const section of below) {
      section.classList.add("reveal-pending");
      observer.observe(section);
    }
    return () => {
      observer.disconnect();
      for (const section of below) section.classList.remove("reveal-pending", "reveal-in");
    };
  }, [pathname]);

  return null;
}
