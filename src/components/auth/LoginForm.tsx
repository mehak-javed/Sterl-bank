"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { safeNext } from "@/lib/auth/guard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logIn } from "@/lib/auth/client";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";
import { AuthField, PasswordInput, describe, inputClass } from "./AuthFields";

/** Email and password. On success, back to the page they wanted (or the dashboard). */
export function LoginForm() {
  const uid = useId();
  const router = useRouter();
  const queries = useQueryClient();
  const next = useSearchParams().get("next");
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginInput) {
    setMessage(undefined);
    const result = await logIn(values);
    if (result.ok) {
      queries.clear(); // start clean: nothing cached from before login
      router.replace(safeNext(next)); // back to the page they asked for (only ever on this site)
    }
    else setMessage(result.message);
  }

  return (
    <form noValidate onSubmit={(e) => handleSubmit(onSubmit)(e)} className="flex flex-col gap-5">
      {/* role="alert": read out as soon as it appears. */}
      {message && (
        <p role="alert" className="rounded-xl border border-[var(--danger)] p-3 text-sm">
          {message}
        </p>
      )}
      <AuthField id={`${uid}-email`} label="Email" error={errors.email?.message}>
        <input {...register("email")} {...describe(`${uid}-email`, errors.email?.message)} type="email" autoComplete="email" className={inputClass} />
      </AuthField>
      <AuthField id={`${uid}-password`} label="Password" error={errors.password?.message}>
        <PasswordInput {...register("password")} {...describe(`${uid}-password`, errors.password?.message)} autoComplete="current-password" />
      </AuthField>
      <button type="submit" disabled={isSubmitting} className="rounded-full btn-primary py-3.5 font-semibold disabled:opacity-60">
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
