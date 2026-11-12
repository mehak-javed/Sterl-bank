"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "./client";

/**
 * The logged-in customer, from the Java API's /api/auth/me, cached by TanStack Query so the
 * sidebar, top bar and greeting share ONE request. (The route guard has already checked the
 * session before the page was served.)
 */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 5 * 60 * 1000 });
}

/** "Alex Example" → "AE". */
export function initialsOf(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}
