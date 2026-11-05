"use client"; // error boundaries must be client components

import { useEffect } from "react";

/**
 * A React error boundary around every banking page. If a page crashes, only the area
 * inside the layout is replaced: the demo banner and nav stay usable.
 * Named ErrorPage, not Error, so we don't hide JavaScript's built-in Error class.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // a real bank would send this to its monitoring service
  }, [error]);

  // We don't show error.message: in production Next hides server error details on purpose,
  // because they can leak internals.
  return (
    <div role="alert" className="glass flex flex-col items-start gap-4 rounded-2xl p-6">
      <h1 className="text-2xl font-semibold text-heading">Something went wrong</h1>
      <p className="text-muted">This page couldn&apos;t be shown. Please try again.</p>
      {/* retry() re-fetches and re-renders the page (Next 16's replacement for reset). */}
      <button type="button" onClick={() => retry()} className="rounded-xl btn-primary px-4 py-2 font-semibold">
        Try again
      </button>
    </div>
  );
}
