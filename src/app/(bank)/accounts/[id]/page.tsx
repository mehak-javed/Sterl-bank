import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountDetail, AccountDetailSkeleton } from "@/components/AccountDetail";
import { findAccount, listAccounts } from "@/server/bank-db";
import { getAccount, getTransactions } from "@/server/queries";

// [id] in the folder name = "any value here". Our 3 account ids are known at build time,
// so Next pre-builds each page's static shell. (With Cache Components on, `dynamicParams`
// isn't available: unknown ids render on request, and notFound() below handles them.)
export async function generateStaticParams() {
  return listAccounts().map((account) => ({ id: account.id }));
}

// The route is "/accounts/[id]" without "(bank)": route groups aren't part of the URL.
// An account's name never changes, so reading it straight from bank-db is fine here.
export async function generateMetadata({ params }: PageProps<"/accounts/[id]">): Promise<Metadata> {
  const { id } = await params; // params is a Promise since Next 15
  return { title: findAccount(id)?.name ?? "Account not found" };
}

/**
 * NOT async, and it doesn't await params. The page's "shell" (everything outside Suspense)
 * is shared by every account link and prefetched before you click, so it must not depend on
 * which id is in the URL. The id-specific part streams in from behind <Suspense>.
 */
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
