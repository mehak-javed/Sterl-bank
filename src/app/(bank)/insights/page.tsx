import type { Metadata } from "next";

export const metadata: Metadata = { title: "Insights" };

// Placeholder: spending by category comes in a later day of the plan.
export default function InsightsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Insights</h1>
      <p className="glass rounded-2xl p-4 text-muted">Coming soon: where your money goes, by category.</p>
    </>
  );
}
