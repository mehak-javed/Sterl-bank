import type { Metadata } from "next";
import Link from "next/link";
import { FxDesk } from "@/components/fx/FxDesk";

export const metadata: Metadata = { title: "Markets · Sterl" };

export default function MarketsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <Link href="/" className="text-sm underline underline-offset-4">← Banking</Link>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-heading">FX desk</h1>
      </header>
      <FxDesk />
    </main>
  );
}
