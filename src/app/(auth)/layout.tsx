import type { ReactNode } from "react";
import { BrandMark } from "@/components/shell/BrandMark";

/**
 * Log in and Sign up: a calm, focused layout. Just the logo (back to the home page) and the form:
 * no menu, no Log in / Sign up buttons repeating what the page itself is for, no footer link lists.
 * Same deep page colour as the public site (.public-site).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site flex w-full flex-1 flex-col">
      <header className="px-4 pt-6 sm:px-8 lg:px-12">
        <BrandMark href="/" label="Sterl home" />
      </header>
      <main id="main" tabIndex={-1} className="flex w-full flex-1 items-start justify-center px-4 py-12 sm:items-center sm:py-16">
        <div className="glass w-full max-w-md rounded-[2rem] p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
