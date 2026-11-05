import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
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

export const metadata: Metadata = {
  // Pages set just their own name ("Cards"); the template turns it into "Cards · Sterl".
  title: { default: "Sterl", template: "%s · Sterl" },
  description: "Sterl is a portfolio demo bank. Not a real bank. All data is fake.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      // Dark is the default, set in the server HTML so the very first paint is already dark
      // (no flash of light). UiStoreProvider changes it if the visitor saved another choice.
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UiStoreProvider>
          <QueryProvider>
            {/* Root level, so FX orders survive moving between Banking and Markets. */}
            <ReduxProvider>
              <DemoBanner />
              {children}
            </ReduxProvider>
          </QueryProvider>
        </UiStoreProvider>
      </body>
    </html>
  );
}
