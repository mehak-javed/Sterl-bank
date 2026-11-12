"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/auth/client";
import { PASSWORD_MIN, passwordStrength, signupSchema, type SignupInput } from "@/lib/auth/schemas";
import { AuthField, PasswordInput, describe, inputClass } from "./AuthFields";

/** First name, last name, email, password (with a strength meter). On success, to the dashboard. */
export function SignupForm() {
  const uid = useId();
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  // useWatch re-renders only this form as the password changes, for the strength meter.
  const password = useWatch({ control, name: "password" }) ?? "";
  const strength = passwordStrength(password);

  async function onSubmit(values: SignupInput) {
    setMessage(undefined);
    const result = await signUp(values);
    if (result.ok) {
      router.replace("/dashboard");
      return;
    }
    setMessage(result.message);
    for (const [field, text] of Object.entries(result.fieldErrors ?? {})) {
      if (text && field in values) setError(field as keyof SignupInput, { message: text });
    }
  }

  const f = (name: string) => `${uid}-${name}`;
  const meterId = f("strength");

  return (
    <form noValidate onSubmit={(e) => handleSubmit(onSubmit)(e)} className="flex flex-col gap-5">
      {message && (
        <p role="alert" className="rounded-xl border border-[var(--danger)] p-3 text-sm">
          {message}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthField id={f("first")} label="First name" error={errors.firstName?.message}>
          <input {...register("firstName")} {...describe(f("first"), errors.firstName?.message)} autoComplete="given-name" className={inputClass} />
        </AuthField>
        <AuthField id={f("last")} label="Last name" error={errors.lastName?.message}>
          <input {...register("lastName")} {...describe(f("last"), errors.lastName?.message)} autoComplete="family-name" className={inputClass} />
        </AuthField>
      </div>
      <AuthField id={f("email")} label="Email" error={errors.email?.message}>
        <input {...register("email")} {...describe(f("email"), errors.email?.message)} type="email" autoComplete="email" className={inputClass} />
      </AuthField>
      <AuthField id={f("password")} label="Password" error={errors.password?.message}>
        <PasswordInput
          {...register("password")}
          {...describe(f("password"), errors.password?.message, meterId)}
          // "new-password": password managers offer to create and save a strong one.
          autoComplete="new-password"
        />
        {/* The strength meter: four bars and a word, so it never relies on colour alone. */}
        <div id={meterId} className="flex items-center gap-3 text-xs text-muted">
          <span aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((bar) => (
              <span key={bar} className={`h-1.5 rounded-full ${strength.score >= bar ? "bg-[var(--accent)]" : "bg-surface-2"}`} />
            ))}
          </span>
          <span aria-live="polite">{password ? strength.label : `At least ${PASSWORD_MIN} characters`}</span>
        </div>
      </AuthField>
      <button type="submit" disabled={isSubmitting} className="rounded-full btn-primary py-3.5 font-semibold disabled:opacity-60">
        {isSubmitting ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
