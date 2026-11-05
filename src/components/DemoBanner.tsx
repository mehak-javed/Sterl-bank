// Shown on every page (rendered from the root layout).
// A demo bank must never be mistaken for a real one.
export function DemoBanner() {
  return (
    <div
      role="note"
      className="w-full bg-banner px-4 py-2 text-center text-sm font-medium text-banner-foreground"
    >
      Sterl is a portfolio demo. Not a real bank. All data is fake.
    </div>
  );
}
