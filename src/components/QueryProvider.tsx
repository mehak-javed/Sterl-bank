"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30s: switching tabs/components won't refetch within that.
        staleTime: 30_000,
        // Retry server hiccups (5xx, network errors) up to 3 times, with growing gaps.
        // Don't retry 4xx: a bad request will be just as bad the second time.
        retry: (failureCount, error) =>
          error instanceof ApiError && error.status < 500 ? false : failureCount < 3,
      },
      // Mutations are NOT retried (TanStack's default, kept on purpose). Blindly re-sending
      // a payment could pay twice. Safe retries need idempotency keys (backend phase).
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Same reason as the Zustand store: one client per browser session, never shared.
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
