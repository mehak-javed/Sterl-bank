import Link from "next/link";

// Shown for unknown URLs and whenever a page calls notFound() (with a real 404 status).
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold text-heading">Page not found</h1>
      <p className="text-muted">We couldn&apos;t find that page or account.</p>
      <Link href="/" className="rounded-xl btn-primary px-4 py-2 font-semibold">
        Back to dashboard
      </Link>
    </main>
  );
}
