import type { Metadata } from "next";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import { ReduxProvider } from "@/stores/fx/ReduxProvider";
import { UiStoreProvider } from "@/stores/UiStoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Roman inscription capitals for the "STERL BANKING" logo. next/font downloads it at build time and
// serves it from our own site: no request to Google from visitors' browsers.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  // Pages set just their own name ("Cards"); the template turns it into "Cards · Sterl".
  title: { default: "Sterl", template: "%s · Sterl" },
  description: "Modern personal banking: every balance at a glance, savings that build themselves.",
  // Not listed by search engines. The site looks like a real bank and has sign-up and application
  // forms; keeping it out of search results stops strangers finding it, and stops it being flagged
  // as a look-alike site. Anyone with the link can still visit normally.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      // Dark is the default, set in the server HTML so the very first paint is already dark
      // (no flash of light). UiStoreProvider changes it if the visitor saved another choice.
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UiStoreProvider>
          <QueryProvider>
            {/* Root level, so FX orders survive moving between Banking and Markets. */}
            <ReduxProvider>
              {children}
            </ReduxProvider>
          </QueryProvider>
        </UiStoreProvider>
      </body>
    </html>
  );
}
