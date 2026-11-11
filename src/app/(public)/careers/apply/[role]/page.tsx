import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MapPin, ShieldAlert } from "lucide-react";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { ROLES, findRole } from "@/lib/careers/roles";

/** Every role's application page is built ahead of time (static), one per slug. */
export function generateStaticParams() {
  return ROLES.map(({ slug }) => ({ role: slug }));
}

export async function generateMetadata({ params }: PageProps<"/careers/apply/[role]">): Promise<Metadata> {
  const role = findRole((await params).role);
  return { title: role ? `Apply: ${role.title}` : "Apply" };
}

/**
 * The dedicated application page for one role: a short header about the role, then the form.
 * The params promise is passed into Suspense (Next's instant-navigation rule with Cache Components):
 * the page shell can show at once while the role is looked up.
 */
export default function ApplyPage({ params }: PageProps<"/careers/apply/[role]">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 sm:px-8">
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-3xl bg-surface-2" />}>
        <ApplyContent params={params} />
      </Suspense>
    </div>
  );
}

async function ApplyContent({ params }: { params: Promise<{ role: string }> }) {
  const role = findRole((await params).role);
  if (!role) notFound();

  return (
    <>
      <Link href={`/careers/jobs/${role.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to the role
      </Link>
      <p className="eyebrow mt-8 text-muted">Apply now</p>
      <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{role.title}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>{role.team}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {role.place}
        </span>
        <span aria-hidden="true">·</span>
        <span>{role.type}</span>
      </p>
      <p className="mt-6 flex items-start gap-3 rounded-2xl border border-line p-4 text-sm">
        <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-heading" />
        <span>
          Sterl never asks for money or bank details during hiring.{" "}
          <Link href="/recruitment-scams" className="font-semibold text-heading underline underline-offset-4">
            Spot a recruitment scam
          </Link>
        </span>
      </p>
      <div className="mt-10">
        <ApplicationForm role={role.slug} roleTitle={role.title} />
      </div>
    </>
  );
}
