import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  GraduationCap,
  HeartHandshake,
  MapPin,
  RefreshCcw,
  Rocket,
  ShieldAlert,
  Sprout,
  Users,
} from "lucide-react";
import { ROLES } from "@/lib/careers/roles";
import { STORIES } from "@/lib/careers/stories";

export const metadata: Metadata = { title: "Careers" };

/** Three ways Sterl helps people build careers (structure inspired by big banks' careers pages; Sterl's words). */
const FOCUS = [
  {
    icon: Sprout,
    title: "Skills from day one",
    text: "Apprenticeships, work placements and recognised qualifications, so people can start without a degree and keep growing.",
  },
  {
    icon: BookOpenCheck,
    title: "Learning that never stops",
    text: "A yearly learning budget, study time and a mentor for everyone, from your first week to your tenth year.",
  },
  {
    icon: HeartHandshake,
    title: "A workplace that works for everyone",
    text: "Fair, skills-based hiring, flexible working and real support for wellbeing, so people stay and thrive.",
  },
];

const VALUES = [
  { icon: GraduationCap, title: "Learn every week", text: "Paid courses, study time and mentors, from apprenticeships to degrees." },
  { icon: Clock, title: "Flexible by default", text: "Hybrid working and hours that fit around the rest of your life." },
  { icon: Rocket, title: "Ship with care", text: "Small teams, real responsibility, and tests before anything reaches a customer." },
  { icon: Users, title: "Belong here", text: "Different backgrounds make better decisions. Bring yours." },
];

const STEPS = [
  { title: "Apply", text: "A CV and a few details. No cover-letter essays." },
  { title: "Chat", text: "A 30-minute call with someone from the team, not a script." },
  { title: "Show us", text: "A short, paid task or a pairing session on a real kind of problem." },
  { title: "Meet the team", text: "Ask us anything, then hear back within a week, either way." },
];

/**
 * Careers (public): Sterl's own careers page, structured like the careers pages of large banks:
 * a hero, three focus areas, people's stories, a returners programme, why Sterl, open roles with an
 * Apply now button each (every role has its own application page), how we hire, and a scam warning.
 */
export default function CareersPage() {
  const openRoles = ROLES.filter((r) => r.slug !== "general");

  return (
    <div className="w-full px-4 pt-12 sm:px-8 lg:px-12">
      {/* Hero */}
      <p className="eyebrow text-muted">Careers</p>
      <h1 className="mt-2 max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
        Build what&apos;s next <span className="text-gold-gradient block">in banking</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Good jobs build good lives, and strong communities. We help people gain the skills, experience and support to grow a
        career, whether they&apos;re starting out, changing direction or coming back.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/careers/apply/general" className="flex items-center gap-2 rounded-full btn-primary px-7 py-3.5 font-semibold">
          Apply now <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
        <a href="#roles" className="flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-semibold hover:bg-surface-2">
          See open roles
        </a>
      </div>

      {/* Three focus areas */}
      <section aria-labelledby="focus-heading" className="mt-24">
        <h2 id="focus-heading" className="max-w-2xl text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          How we help people build careers
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FOCUS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
              <span aria-hidden="true" className="chip h-11 w-11">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Stories */}
      <section aria-labelledby="stories-heading" className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="stories-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
            Careers that grew here
          </h2>
          <Link href="/#people" className="inline-flex items-center gap-2 font-semibold text-heading">
            Meet our people <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STORIES.map((story) => (
            <li key={story.name} className="panel overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/3]">
                <Image src={story.photo.src} alt={story.photo.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
              </div>
              <div className="p-5">
                <p className="font-semibold">{story.title}</p>
                <p className="mt-2 text-sm text-muted">
                  {story.name} · {story.role}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Returners */}
      <section aria-labelledby="returners-heading" className="panel mt-24 grid gap-6 rounded-[2rem] p-8 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-center">
        <span aria-hidden="true" className="chip h-14 w-14">
          <RefreshCcw className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="returners-heading" className="text-2xl font-semibold text-heading sm:text-3xl">
            Fresh Starts: coming back to work
          </h2>
          <p className="mt-3 max-w-3xl text-muted">
            Been away from work for a while, for caring, health or any other reason? Our 16-week paid returners programme
            gives you a team, a mentor and a real project, with a permanent role at the end for everyone who wants one.
          </p>
        </div>
      </section>

      {/* Why Sterl */}
      <section aria-labelledby="why-heading" className="mt-24">
        <h2 id="why-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Why Sterl
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
              <span aria-hidden="true" className="chip h-11 w-11">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Open roles */}
      <section id="roles" aria-labelledby="roles-heading" className="mt-24 scroll-mt-28">
        <h2 id="roles-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Open roles
        </h2>
        <ul className="panel mt-8 divide-y divide-[var(--line)] rounded-3xl">
          {openRoles.map(({ slug, title, team, place, type }) => (
            <li key={slug} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <span>
                <span className="block text-lg font-semibold">{title}</span>
                <span className="text-sm text-muted">{team}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {place}
                </span>
                <span className="rounded-full border border-line px-3 py-1">{type}</span>
                <Link
                  href={`/careers/apply/${slug}`}
                  aria-label={`Apply now: ${title}`}
                  className="flex items-center gap-1.5 rounded-full btn-primary px-4 py-1.5 font-semibold"
                >
                  Apply now <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Don&apos;t see the right role?{" "}
          <Link href="/careers/apply/general" className="font-semibold text-heading underline underline-offset-4">
            Send an open application
          </Link>
          .
        </p>
      </section>

      {/* How we hire */}
      <section aria-labelledby="hire-heading" className="mt-24">
        <h2 id="hire-heading" className="text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          How we hire
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
              <span aria-hidden="true" className="text-gold-gradient text-4xl font-semibold">
                0{i + 1}
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-3 text-sm">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-heading" />
          <span>
            We never ask for money or bank details while you apply.{" "}
            <Link href="/recruitment-scams" className="font-semibold text-heading underline underline-offset-4">
              How to spot a recruitment scam
            </Link>
          </span>
        </p>
      </section>
    </div>
  );
}
