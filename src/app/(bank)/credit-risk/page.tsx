import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credit risk" };

/**
 * The Credit Risk desk. Placeholder for now: the data (Day 15), the Java ExposureService
 * (Day 16), the SQL reports (Day 17) and this screen (Day 18) come in week 3.
 * The terms below are the team's vocabulary, so the page doubles as a glossary.
 */
const TERMS = [
  ["Counterparty", "A company the bank lends to."],
  ["Credit rating", "How likely the company is to repay, from AAA (safest) to CCC (risky)."],
  ["Credit limit", "The most the bank will lend to one counterparty."],
  ["Exposure", "How much the counterparty owes right now."],
  ["Limit utilisation", "Exposure divided by limit: under 75% is fine, 75–100% is a warning, over 100% is a breach."],
  ["Concentration risk", "Too much lending to one sector, rating or country."],
] as const;

export default function CreditRiskPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Credit risk</h1>

      <section aria-labelledby="coming-heading" className="glass rounded-2xl p-4">
        <h2 id="coming-heading" className="mb-2 text-lg font-semibold text-heading">
          Coming soon
        </h2>
        <p className="text-muted">
          A desk for lending to companies: 500 fictional borrowers, their credit limits and exposure, limit
          breaches that need review, and where the bank&apos;s lending is concentrated. All companies are fake.
        </p>
      </section>

      <section aria-labelledby="terms-heading" className="glass rounded-2xl p-4">
        <h2 id="terms-heading" className="mb-3 text-lg font-semibold text-heading">
          Key terms
        </h2>
        {/* <dl>: the right HTML for term + definition pairs; screen readers announce them as a list. */}
        <dl className="grid gap-3 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          {TERMS.map(([term, meaning]) => (
            <div key={term} className="contents">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
