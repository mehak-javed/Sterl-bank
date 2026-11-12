import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, MapPin, PoundSterling, Sparkles, Users } from "lucide-react";
import { ROLES, findRole } from "@/lib/careers/roles";

/** One job page per role, built ahead of time (static). */
export function generateStaticParams() {
  return ROLES.map(({ slug }) => ({ role: slug }));
}

export async function generateMetadata({ params }: PageProps<"/careers/jobs/[role]">): Promise<Metadata> {
  const role = findRole((await params).role);
  return role ? { title: role.title, description: role.summary } : { title: "Job" };
}

/**
 * A role's details: summary, the facts (team, location, type, salary), what you'll do, what you'll
 * need, nice-to-haves, then Apply now (to the application form). The params promise goes into
 * Suspense, as on the apply page (Cache Components' instant-navigation rule).
 */
export default function JobPage({ params }: PageProps<"/careers/jobs/[role]">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-8">
      <Link href="/careers#roles" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All roles
      </Link>
      <Suspense fallback={<div className="mt-8 h-60 animate-pulse rounded-3xl bg-surface-2" />}>
        <JobContent params={params} />
      </Suspense>
    </div>
  );
}

function List({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className={`flex items-start gap-3 ${muted ? "text-muted" : ""}`}>
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-heading" />
          {item}
        </li>
      ))}
    </ul>
  );
}

async function JobContent({ params }: { params: Promise<{ role: string }> }) {
  const role = findRole((await params).role);
  if (!role) notFound();

  const facts = [
    { icon: Users, label: "Team", value: role.team },
    { icon: MapPin, label: "Location", value: role.place },
    { icon: Briefcase, label: "Job type", value: role.type },
    { icon: PoundSterling, label: "Salary", value: role.salary },
  ];
  const apply = (
    <Link
      href={`/careers/apply/${role.slug}`}
      className="inline-flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 font-semibold"
    >
      Apply now <ArrowRight aria-hidden="true" className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      <h1 className="mt-8 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{role.title}</h1>
      <p className="mt-5 max-w-3xl text-lg text-muted">{role.summary}</p>

      {/* The key facts at a glance */}
      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="panel rounded-2xl p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
              <Icon aria-hidden="true" className="h-4 w-4 text-heading" /> {label}
            </dt>
            <dd className="mt-2 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">{apply}</div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="do-heading">
          <h2 id="do-heading" className="text-2xl font-semibold text-heading">
            What you&apos;ll do
          </h2>
          <List items={role.responsibilities} />
        </section>
        <section aria-labelledby="need-heading">
          <h2 id="need-heading" className="text-2xl font-semibold text-heading">
            What you&apos;ll need
          </h2>
          <List items={role.requirements} />
        </section>
      </div>

      <section aria-labelledby="nice-heading" className="panel mt-12 rounded-3xl p-6 sm:p-8">
        <h2 id="nice-heading" className="flex items-center gap-2 text-xl font-semibold text-heading">
          <Sparkles aria-hidden="true" className="h-5 w-5" /> Nice to have
        </h2>
        <List items={role.niceToHave} muted />
      </section>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="text-lg font-semibold">Sound like you? We&apos;d love to hear from you.</p>
        {apply}
      </div>
    </>
  );
}
