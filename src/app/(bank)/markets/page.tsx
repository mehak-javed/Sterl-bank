import type { Metadata } from "next";
import { FxDesk } from "@/components/fx/FxDesk";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">FX desk</h1>
      <FxDesk />
    </>
  );
}
