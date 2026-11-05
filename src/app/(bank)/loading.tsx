import { SkeletonRows } from "@/components/QueryStates";

// Next wraps each page in <Suspense> with this as the fallback, shown while the page's server part renders.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading page" className="glass rounded-2xl p-4">
      <SkeletonRows rows={4} />
    </div>
  );
}
