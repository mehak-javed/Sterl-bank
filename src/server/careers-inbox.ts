import "server-only";
import type { Application, ResumeKind } from "@/lib/careers/application";

/** A validated application, ready to hand over to whoever reads applications. */
export type Submission = {
  reference: string;
  application: Application;
  resume: { name: string; kind: ResumeKind; bytes: Uint8Array };
};

/**
 * Where applications go. An INTERFACE, so the rest of the code doesn't care how delivery works:
 * a real company would plug in an email service (sending to its careers address) or an applicant
 * tracking system here, configured with secrets from the environment, never from the code.
 */
export interface CareersInbox {
  deliver(submission: Submission): Promise<void>;
}

/**
 * The demo inbox: accepts the validated application and deliberately sends and stores NOTHING.
 * Sterl isn't really hiring, and a real CV is personal data (UK GDPR): collecting it for jobs that
 * don't exist would be wrong. Only a one-line log with the reference, never the person's details.
 */
export const demoCareersInbox: CareersInbox = {
  async deliver({ reference, application, resume }) {
    console.info(`[careers] application ${reference} received for ${application.role} (${resume.kind}, ${resume.bytes.length} bytes); demo: not sent or stored`);
  },
};
