/** Shared by the home page's Help section and the /help page. */
export const QUESTIONS = [
  {
    q: "How do I open an account?",
    a: "Choose Sign up and enter your name, email and a password. It takes about a minute.",
  },
  {
    q: "How do round-ups work?",
    a: "Each card payment is rounded up to the next pound, and the difference moves into your Round-up Pot. Spend £3.47 and 53p is saved.",
  },
  {
    q: "Can I freeze my card?",
    a: "Yes, in one tap from the Cards page, and unfreeze it just as quickly if it turns up.",
  },
  {
    q: "Where do your exchange rates come from?",
    a: "Daily reference rates published by central banks. Prices on the markets desk are indicative and not for trading.",
  },
  {
    q: "What happens to my data?",
    a: "We keep only what running your account needs, and display settings like the theme stay in your own browser. See Security and confidentiality for more.",
  },
] as const;

/**
 * <details>/<summary>: the browser's own expanding sections, keyboard and screen-reader friendly
 * without any JavaScript, so this stays a Server Component.
 */
export function HelpQuestions() {
  return (
    <div className="flex flex-col gap-3">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="panel group rounded-2xl p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {q}
            <span aria-hidden="true" className="chip h-8 w-8 shrink-0 text-lg transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
