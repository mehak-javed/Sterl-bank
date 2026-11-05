import type { Metadata } from "next";
import { CardPanel } from "@/components/CardPanel";

export const metadata: Metadata = { title: "Cards" };

export default function CardsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">Cards</h1>
      <div className="max-w-md">
        <CardPanel />
      </div>
    </>
  );
}
