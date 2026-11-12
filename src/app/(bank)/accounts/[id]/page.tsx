import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountDetail, AccountDetailSkeleton } from "@/components/AccountDetail";
import { getAccount, getTransactions } from "@/server/queries";

// [id] in the folder name = "any value here". Our 3 account ids are known at build time,
// so Next pre-builds each page's static shell. (With Cache Components on, `dynamicParams`
// isn't available: unknown ids render on request, and notFound() below handles them.)
// Personal pages are never prebuilt: every account page is rendered for the logged-in customer
// (which account ids exist depends on who is asking).
export const metadata: Metadata = { title: "Account" };

export default function AccountPage({ params }: PageProps<"/accounts/[id]">) {
  return (
    <>
      <Link href="/dashboard" className="self-start text-sm underline underline-offset-4">
        ← Dashboard
      </Link>
      <Suspense fallback={<AccountDetailSkeleton />}>
        {/* Pass the params PROMISE down; only this child waits for it. */}
        <AccountContent params={params} />
      </Suspense>
    </>
  );
}

async function AccountContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Start both reads at once. Awaiting them one after another would be a "waterfall":
  // the transactions would only start loading after the account had finished.
  const [account, transactions] = await Promise.all([getAccount(id), getTransactions(id, 50)]);
  if (!account) notFound();

  return <AccountDetail account={account} transactions={transactions} />;
}
