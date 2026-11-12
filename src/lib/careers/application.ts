import { z } from "zod";

/*
 * ONE description of a valid job application, used twice:
 *   - in the browser (React Hook Form + zodResolver) for instant, friendly field errors;
 *   - on the server (the server action) as the real gatekeeper, because anything the browser checks
 *     can be bypassed by someone sending requests directly.
 */

export const EDUCATION_LEVELS = [
  "GCSEs or equivalent",
  "A-levels or Highers",
  "Apprenticeship",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
  "Other",
] as const;

export const RIGHT_TO_WORK = ["Yes", "No, I would need sponsorship"] as const;

/** The CV file: what the form accepts. 5 MB keeps uploads quick and is plenty for a CV. */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/; // "2024-09", what <input type="month"> sends
const thisYear = new Date().getFullYear();

const trimmed = (max: number, label: string) =>
  z.string().trim().min(1, `Enter your ${label}`).max(max, `Keep your ${label} under ${max} characters`);

export const experienceSchema = z
  .object({
    title: trimmed(80, "job title"),
    employer: trimmed(80, "employer"),
    start: z.string().regex(MONTH, "Choose a start month"),
    // Empty end = "I still work here".
    end: z.union([z.literal(""), z.string().regex(MONTH, "Choose an end month")]),
    summary: z.string().trim().max(500, "Keep this under 500 characters"),
  })
  // "YYYY-MM" strings sort in date order, so a plain comparison works.
  .refine((e) => e.end === "" || e.end >= e.start, { path: ["end"], message: "The end can't be before the start" });

export const applicationSchema = z.object({
  role: z.string().min(1),
  // Personal information
  firstName: trimmed(50, "first name"),
  lastName: trimmed(50, "last name"),
  email: z.string().trim().email("Enter an email address like name@example.com").max(254),
  // UK numbers: 07… mobile or +44 7…; spaces allowed.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^(?:\+44|0)7\d{9}$/, "Enter a UK mobile number, like 07700 900123")),
  city: trimmed(60, "town or city"),
  rightToWork: z.enum(RIGHT_TO_WORK, { message: "Tell us whether you can work in the UK" }),
  linkedin: z.union([
    z.literal(""),
    z.string().trim().url("Enter a full link, starting https://").max(200),
  ]),
  // Education
  educationLevel: z.enum(EDUCATION_LEVELS, { message: "Choose your highest qualification" }),
  institution: trimmed(100, "school, college or university"),
  subject: trimmed(100, "subject"),
  graduationYear: z.coerce
    .number({ message: "Enter a year" })
    .int()
    .min(1960, "Enter a year from 1960")
    .max(thisYear + 6, `Enter a year up to ${thisYear + 6}`),
  // Experience: up to 5 roles (none is fine for apprenticeships).
  experience: z.array(experienceSchema).max(5, "Add up to 5 roles"),
  coverNote: z.string().trim().max(1000, "Keep your note under 1,000 characters"),
  // Consent: a tick box that must be ticked (a boolean the form starts as false).
  consent: z.boolean().refine((v) => v, { message: "Please confirm to continue" }),
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type Application = z.output<typeof applicationSchema>;

/** The kinds of CV we accept, identified by the file's FIRST BYTES ("magic numbers"), not its name. */
export type ResumeKind = "pdf" | "docx" | "doc";

/**
 * Works out what a file really is from its first bytes. A file's name and its declared type are
 * both chosen by the sender, so "cv.pdf" could be anything; the bytes can't lie so easily.
 *   PDF:  %PDF                    (25 50 44 46)
 *   DOCX: a ZIP archive           (50 4B 03 04, "PK")
 *   DOC:  an old Office document  (D0 CF 11 E0)
 */
export function detectResumeKind(head: Uint8Array): ResumeKind | null {
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46)) return "pdf";
  if (starts(0x50, 0x4b, 0x03, 0x04)) return "docx";
  if (starts(0xd0, 0xcf, 0x11, 0xe0)) return "doc";
  return null;
}

/** Checks a CV's size and name before upload (the server checks the bytes as well). */
export function checkResumeFile(file: { name: string; size: number }): string | null {
  if (file.size === 0) return "That file is empty";
  if (file.size > RESUME_MAX_BYTES) return "Your CV must be 5 MB or smaller";
  const name = file.name.toLowerCase();
  if (!RESUME_EXTENSIONS.some((ext) => name.endsWith(ext))) return "Upload a PDF or Word document";
  return null;
}
