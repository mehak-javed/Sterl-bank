"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, Plus, Trash2, Upload } from "lucide-react";
import {
  EDUCATION_LEVELS,
  RIGHT_TO_WORK,
  applicationSchema,
  checkResumeFile,
  type Application,
  type ApplicationInput,
} from "@/lib/careers/application";
import { submitApplication } from "@/server/careers-actions";

const inputClass =
  "w-full min-w-0 rounded-xl border border-line bg-surface-2 px-4 py-3 text-base aria-invalid:border-[var(--danger)]";

/** A labelled field with its error underneath, linked for screen readers (aria-describedby). */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props for an input: its id, invalid state and the ids of its hint/error text. */
function a11y(id: string, error?: unknown, hint = false) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
}

/**
 * The job application form. React Hook Form keeps typing fast (inputs aren't re-rendered on every
 * key); Zod (the same schema the server uses) gives instant, friendly errors. The CV is checked
 * here for size and type, and again on the server, which also reads the file's real bytes.
 */
export function ApplicationForm({ role, roleTitle }: { role: string; roleTitle: string }) {
  const uid = useId();
  const f = (name: string) => `${uid}-${name}`;
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string>();
  const [serverMessage, setServerMessage] = useState<string>();
  const [reference, setReference] = useState<string>();
  const summaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput, unknown, Application>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      role,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      linkedin: "",
      institution: "",
      subject: "",
      graduationYear: "",
      experience: [],
      coverNote: "",
      consent: false,
    },
  });
  const jobs = useFieldArray({ control, name: "experience" });

  /** Other answers need fixing: flag a missing CV at the same time, so the summary counts it too. */
  function onInvalid() {
    if (!resume) setResumeError("Upload your CV");
    summaryRef.current?.focus();
  }

  async function onValid(data: Application) {
    setServerMessage(undefined);
    const problem = resume ? checkResumeFile(resume) : "Upload your CV";
    if (problem || !resume) {
      setResumeError(problem ?? "Upload your CV");
      return;
    }
    const body = new FormData();
    body.set("fields", JSON.stringify(data));
    body.set("resume", resume);
    const result = await submitApplication(body);
    if (result.ok) {
      setReference(result.reference);
      return;
    }
    setServerMessage(result.message);
    for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
      if (path === "resume") setResumeError(message);
      else setError(path as keyof ApplicationInput, { message });
    }
    summaryRef.current?.focus();
  }

  if (reference) {
    return (
      <div role="status" className="panel flex flex-col items-start gap-4 rounded-[2rem] p-8">
        <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-heading" />
        <h2 className="text-3xl font-semibold tracking-tight">Application received</h2>
        <p className="text-muted">
          Thank you for applying for <strong className="text-foreground">{roleTitle}</strong>. Your reference is{" "}
          <strong className="text-foreground tabular-nums">{reference}</strong>.
        </p>
        <p className="text-muted">
          We read every application and reply within two weeks, by email from an <strong>@sterl.example</strong>{" "}
          address. We will never ask you for money or bank details.
        </p>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length + (resumeError ? 1 : 0);

  return (
    <form
      noValidate
      // handleSubmit is called at submit time (inside the arrow), not during render: the error
      // summary ref is only touched when the form is actually submitted.
      onSubmit={(event) => handleSubmit(onValid, onInvalid)(event)}
      className="flex flex-col gap-10"
      aria-describedby={`${uid}-demo`}
    >
      <p id={`${uid}-demo`} className="rounded-2xl border border-line bg-surface-2/60 p-4 text-sm">
        Please use made-up details. Applications on this site are checked and then deleted, never sent or stored.
      </p>

      {/* The error summary: focused after a failed submit, so screen-reader users hear what to fix. */}
      <div ref={summaryRef} tabIndex={-1} aria-live="assertive">
        {(errorCount > 0 || serverMessage) && (
          <p className="rounded-2xl border border-[var(--danger)] p-4 text-sm">
            {serverMessage ?? `Please check ${errorCount === 1 ? "1 answer" : `${errorCount} answers`} below.`}
          </p>
        )}
      </div>

      <input type="hidden" {...register("role")} />

      {/* 1. Personal information */}
      <fieldset className="panel grid grid-cols-1 gap-5 rounded-3xl p-6 sm:grid-cols-2 sm:p-8">
        <legend className="mb-2 px-1 text-xl font-semibold text-heading">Personal information</legend>
        <Field id={f("firstName")} label="First name" error={errors.firstName?.message}>
          <input {...register("firstName")} {...a11y(f("firstName"), errors.firstName)} autoComplete="given-name" className={inputClass} />
        </Field>
        <Field id={f("lastName")} label="Last name" error={errors.lastName?.message}>
          <input {...register("lastName")} {...a11y(f("lastName"), errors.lastName)} autoComplete="family-name" className={inputClass} />
        </Field>
        <Field id={f("email")} label="Email" error={errors.email?.message}>
          <input {...register("email")} {...a11y(f("email"), errors.email)} type="email" autoComplete="email" className={inputClass} />
        </Field>
        <Field id={f("phone")} label="Mobile number" hint="A UK mobile, like 07700 900123" error={errors.phone?.message}>
          <input {...register("phone")} {...a11y(f("phone"), errors.phone, true)} type="tel" autoComplete="tel" className={inputClass} />
        </Field>
        <Field id={f("city")} label="Town or city" error={errors.city?.message}>
          <input {...register("city")} {...a11y(f("city"), errors.city)} autoComplete="address-level2" className={inputClass} />
        </Field>
        <Field id={f("rightToWork")} label="Do you have the right to work in the UK?" error={errors.rightToWork?.message}>
          <select {...register("rightToWork")} {...a11y(f("rightToWork"), errors.rightToWork)} defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose one
            </option>
            {RIGHT_TO_WORK.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field id={f("linkedin")} label="LinkedIn or portfolio (optional)" error={errors.linkedin?.message}>
            <input {...register("linkedin")} {...a11y(f("linkedin"), errors.linkedin)} type="url" inputMode="url" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* 2. Education */}
      <fieldset className="panel grid grid-cols-1 gap-5 rounded-3xl p-6 sm:grid-cols-2 sm:p-8">
        <legend className="mb-2 px-1 text-xl font-semibold text-heading">Education</legend>
        <Field id={f("educationLevel")} label="Highest qualification" error={errors.educationLevel?.message}>
          <select {...register("educationLevel")} {...a11y(f("educationLevel"), errors.educationLevel)} defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose one
            </option>
            {EDUCATION_LEVELS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field id={f("institution")} label="School, college or university" error={errors.institution?.message}>
          <input {...register("institution")} {...a11y(f("institution"), errors.institution)} className={inputClass} />
        </Field>
        <Field id={f("subject")} label="Subject" error={errors.subject?.message}>
          <input {...register("subject")} {...a11y(f("subject"), errors.subject)} className={inputClass} />
        </Field>
        <Field id={f("graduationYear")} label="Year finished (or expected)" error={errors.graduationYear?.message}>
          <input
            {...register("graduationYear")}
            {...a11y(f("graduationYear"), errors.graduationYear)}
            inputMode="numeric"
            maxLength={4}
            className={inputClass}
          />
        </Field>
      </fieldset>

      {/* 3. Experience: a list the applicant can grow and shrink (useFieldArray). */}
      <fieldset className="panel flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
        <legend className="mb-2 px-1 text-xl font-semibold text-heading">Experience</legend>
        <p className="text-sm text-muted">Add your most recent roles (up to 5). No experience yet? That&apos;s fine for apprenticeships.</p>
        {jobs.fields.map((job, i) => {
          const e = errors.experience?.[i];
          return (
            <div key={job.id} className="grid grid-cols-1 gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
              <Field id={f(`job${i}-title`)} label="Job title" error={e?.title?.message}>
                <input {...register(`experience.${i}.title`)} {...a11y(f(`job${i}-title`), e?.title)} className={inputClass} />
              </Field>
              <Field id={f(`job${i}-employer`)} label="Employer" error={e?.employer?.message}>
                <input {...register(`experience.${i}.employer`)} {...a11y(f(`job${i}-employer`), e?.employer)} className={inputClass} />
              </Field>
              <Field id={f(`job${i}-start`)} label="Started" error={e?.start?.message}>
                <input {...register(`experience.${i}.start`)} {...a11y(f(`job${i}-start`), e?.start)} type="month" className={inputClass} />
              </Field>
              <Field id={f(`job${i}-end`)} label="Finished" hint="Leave empty if you still work here" error={e?.end?.message}>
                <input {...register(`experience.${i}.end`)} {...a11y(f(`job${i}-end`), e?.end, true)} type="month" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field id={f(`job${i}-summary`)} label="What you did (optional)" error={e?.summary?.message}>
                  <textarea {...register(`experience.${i}.summary`)} {...a11y(f(`job${i}-summary`), e?.summary)} rows={3} className={inputClass} />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => jobs.remove(i)}
                className="flex items-center gap-2 justify-self-start text-sm font-semibold text-muted hover:text-foreground"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" /> Remove this role
              </button>
            </div>
          );
        })}
        {jobs.fields.length < 5 && (
          <button
            type="button"
            onClick={() => jobs.append({ title: "", employer: "", start: "", end: "", summary: "" })}
            className="flex items-center gap-2 self-start rounded-full btn-secondary px-5 py-2.5 text-sm font-semibold"
          >
            <Plus aria-hidden="true" className="h-4 w-4" /> Add a role
          </button>
        )}
      </fieldset>

      {/* 4. CV upload and a short note */}
      <fieldset className="panel flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
        <legend className="mb-2 px-1 text-xl font-semibold text-heading">Your CV</legend>
        <Field id={f("resume")} label="Upload your CV" hint="PDF or Word, up to 5 MB" error={resumeError}>
          <label
            htmlFor={f("resume")}
            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-line bg-surface-2/60 p-5 hover:bg-surface-2"
          >
            {resume ? <FileText aria-hidden="true" className="h-6 w-6 text-heading" /> : <Upload aria-hidden="true" className="h-6 w-6 text-heading" />}
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">{resume ? resume.name : "Choose a file"}</span>
              <span className="text-muted">{resume ? `${(resume.size / 1024 / 1024).toFixed(1)} MB` : "or drop it here"}</span>
            </span>
          </label>
          <input
            {...a11y(f("resume"), resumeError, true)}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setResume(file);
              setResumeError(file ? (checkResumeFile(file) ?? undefined) : undefined);
            }}
          />
        </Field>
        <Field id={f("coverNote")} label="Anything you'd like us to know? (optional)" error={errors.coverNote?.message}>
          <textarea {...register("coverNote")} {...a11y(f("coverNote"), errors.coverNote)} rows={4} className={inputClass} />
        </Field>
      </fieldset>

      {/* 5. Consent and submit */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" {...register("consent")} {...a11y(f("consent"), errors.consent)} className="mt-1 h-4 w-4" />
          <span>
            I agree that Sterl can use these details to consider my application. (On this site, they&apos;re checked and then
            deleted.)
          </span>
        </label>
        {errors.consent && (
          <p id={`${f("consent")}-error`} className="text-sm text-[var(--danger)]">
            {errors.consent.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-full btn-primary px-8 py-3.5 font-semibold disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
