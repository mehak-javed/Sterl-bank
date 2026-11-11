"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight, Quote } from "lucide-react";
import { STORIES } from "@/lib/careers/stories";


/**
 * "Meet our people": one story at a time, with a large photo, the story's headline and a quote.
 * Underneath: previous / next buttons with "1 / 4", and every story as a tab with a progress line
 * (gold on the one showing). No autoplay: content that changes on its own needs a pause button
 * (WCAG 2.2.2), and a story should stay put while someone reads it.
 */
export function PeopleStories() {
  const [index, setIndex] = useState(0);
  const story = STORIES[index];
  const count = STORIES.length;

  return (
    <div>
      {/* The photo column is capped at 24rem, so the story beside it stays the focus. */}
      <div aria-live="polite" className="grid items-center gap-10 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
        <figure key={story.name} className="rise-in mx-auto w-full max-w-sm lg:mx-0">
          <div className="people-frame relative aspect-[5/6] overflow-hidden rounded-[2rem]">
            {/* next/image: resized and converted (WebP/AVIF) for each screen, loaded lazily except
                the first one, which is likely on screen when the section is reached. */}
            <Image
              src={story.photo.src}
              alt={story.photo.alt}
              fill
              sizes="(min-width: 1024px) 24rem, 90vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        </figure>
        <div key={story.title} className="rise-in">
          <Quote aria-hidden="true" className="h-8 w-8 text-heading" />
          <h3 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{story.title}</h3>
          <p className="mt-5 text-lg text-muted">&ldquo;{story.quote}&rdquo;</p>
          <p className="mt-6 font-semibold">
            {story.name} <span className="font-normal text-muted">· {story.role}</span>
          </p>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16">
        <div>
          <p className="text-xl font-semibold">More stories</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous story"
              onClick={() => setIndex((index - 1 + count) % count)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line hover:bg-surface-2"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <span className="min-w-12 text-center font-semibold tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Next story"
              onClick={() => setIndex((index + 1) % count)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line hover:bg-surface-2"
            >
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {STORIES.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className={`group flex w-full items-start justify-between gap-3 border-t-2 pt-4 text-left font-semibold transition-colors ${
                  i === index ? "border-[var(--accent)] text-heading" : "border-line hover:text-heading"
                }`}
              >
                {s.title}
                <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
