"use client";

import Link from "next/link";
import { useMe } from "@/lib/auth/useMe";
import { moreLinksFor } from "@/lib/nav";
import { NavIcon } from "./NavIcon";

/** The phone "More" sheet's links: only the ones this person may use (role from the session). */
export function MoreNavLinks() {
  const role = useMe().data?.role;
  return (
    <>
      {moreLinksFor(role).map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 font-medium">
            <NavIcon href={href} className="h-5 w-5 text-heading" />
            {label}
          </Link>
        </li>
      ))}
    </>
  );
}
