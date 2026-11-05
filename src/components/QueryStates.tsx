/** Grey placeholder rows while data loads. aria-hidden: the section's aria-busy tells screen readers. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 rounded-lg bg-line motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

/** A clear error with a way out. role="alert" makes screen readers announce it straight away. */
export function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3 text-sm">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="rounded-md border border-line px-3 py-1 font-medium">
        Try again
      </button>
    </div>
  );
}
