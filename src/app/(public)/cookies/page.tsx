import type { Metadata } from "next";
import { CONSENT_COOKIE } from "@/lib/consent";

export const metadata: Metadata = { title: "Cookies" };

/** Every cookie (and browser storage item) Sterl uses. Keep this list true when anything is added. */
const COOKIES = [
  { name: "SESSION", purpose: "Keeps you logged in.", kind: "Essential", lasts: "Until you log out, or after 1 hour without activity" },
  { name: "XSRF-TOKEN", purpose: "Stops other websites sending requests in your name.", kind: "Essential", lasts: "Your visit" },
  { name: CONSENT_COOKIE, purpose: "Remembers your cookie choice.", kind: "Essential", lasts: "1 year" },
  { name: "sterl-ui (browser storage)", purpose: "Remembers display settings such as dark mode.", kind: "Essential", lasts: "Until you clear it" },
];

/** The cookie policy: what Sterl stores in your browser, why, and for how long. */
export default function CookiesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 sm:px-8">
      <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">Cookies</h1>
      <p className="mt-5 text-lg text-muted">
        Cookies are small files a website saves in your browser. We use only what Sterl needs to work and to keep your
        account safe. We don&apos;t use advertising cookies, and we never set optional cookies unless you accept them.
      </p>

      <div className="panel mt-10 overflow-x-auto rounded-3xl">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Cookies Sterl uses</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="p-4 font-medium">Name</th>
              <th scope="col" className="p-4 font-medium">What it does</th>
              <th scope="col" className="p-4 font-medium">Type</th>
              <th scope="col" className="p-4 font-medium">How long</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map(({ name, purpose, kind, lasts }) => (
              <tr key={name} className="border-b border-line last:border-0">
                <th scope="row" className="p-4 font-mono text-xs font-normal">{name}</th>
                <td className="p-4">{purpose}</td>
                <td className="p-4">{kind}</td>
                <td className="p-4 text-muted">{lasts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-heading">Changing your mind</h2>
      <p className="mt-3 text-muted">
        To see the cookie choice again, delete the {CONSENT_COOKIE} cookie in your browser&apos;s settings, or clear this
        site&apos;s data. Essential cookies can&apos;t be switched off, because Sterl can&apos;t keep you logged in safely
        without them.
      </p>
    </div>
  );
}
