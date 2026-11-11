import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STORIES } from "@/lib/careers/stories";
import { PeopleStories } from "./PeopleStories";

// next/image checks its allowed hosts against next.config, which tests don't load: a plain <img>
// stands in, so these tests check OUR markup (alt text, credits), not Next's image optimiser.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a test stand-in, never shipped to users
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Meet our people", () => {
  const html = renderToStaticMarkup(<PeopleStories />);

  it("starts on the first story, marked as current", () => {
    expect(html).toContain(`1 / ${STORIES.length}`);
    expect(html).toMatch(/aria-current="true"[^>]*>Kai changed careers/);
  });

  it("has labelled previous and next buttons and a tab for every story", () => {
    expect(html).toContain('aria-label="Previous story"');
    expect(html).toContain('aria-label="Next story"');
    expect(html.match(/<li>/g)).toHaveLength(STORIES.length);
  });

  it("describes the photo for screen readers, with no credit tag shown under it", () => {
    expect(html).toContain(`alt="${STORIES[0].photo.alt}"`);
    expect(html).not.toContain("on Unsplash");
  });

  it("only uses free Unsplash photos from the allowed image host, with the photographer on record", () => {
    for (const { photo } of STORIES) {
      expect(photo.src).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(photo.profile).toMatch(/^https:\/\/unsplash\.com\/@/);
    }
  });

  it("announces story changes to screen readers", () => {
    expect(html).toContain('aria-live="polite"');
  });
});
