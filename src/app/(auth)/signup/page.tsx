import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Open an account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Open your account</h1>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already with Sterl?{" "}
        <Link href="/login" className="text-heading underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
