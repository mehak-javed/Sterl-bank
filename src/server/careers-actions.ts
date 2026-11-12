"use server";

import { randomBytes } from "node:crypto";
import { findRole } from "@/lib/careers/roles";
import { applicationSchema, checkResumeFile, detectResumeKind } from "@/lib/careers/application";
import { loggingCareersInbox } from "./careers-inbox";

export type ApplyResult =
  | { ok: true; reference: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Receives a job application. Everything is checked AGAIN here, whatever the browser already
 * checked: requests can be sent without the form, so the server is the real gatekeeper.
 */
export async function submitApplication(formData: FormData): Promise<ApplyResult> {
  // The form's fields arrive as one JSON string (they include a list of past jobs), the CV as a file.
  let fields: unknown;
  try {
    fields = JSON.parse(String(formData.get("fields") ?? ""));
  } catch {
    return { ok: false, message: "We couldn't read your application. Please try again." };
  }

  const parsed = applicationSchema.safeParse(fields);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Some answers need another look.", fieldErrors };
  }
  if (!findRole(parsed.data.role)) return { ok: false, message: "That role isn't open." };

  const resume = formData.get("resume");
  if (!(resume instanceof File)) return { ok: false, message: "Upload your CV.", fieldErrors: { resume: "Upload your CV" } };
  const fileProblem = checkResumeFile(resume);
  if (fileProblem) return { ok: false, message: fileProblem, fieldErrors: { resume: fileProblem } };

  // Read the bytes and check what the file REALLY is (its name and type are chosen by the sender).
  const bytes = new Uint8Array(await resume.arrayBuffer());
  const kind = detectResumeKind(bytes.subarray(0, 8));
  if (!kind) {
    const message = "That file doesn't look like a PDF or Word document";
    return { ok: false, message, fieldErrors: { resume: message } };
  }

  // A short, unguessable reference for the applicant, e.g. "STL-4F9A2C1B".
  const reference = `STL-${randomBytes(4).toString("hex").toUpperCase()}`;
  await loggingCareersInbox.deliver({ reference, application: parsed.data, resume: { name: resume.name, kind, bytes } });
  return { ok: true, reference };
}
