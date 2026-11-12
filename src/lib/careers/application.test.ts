import { describe, expect, it, vi } from "vitest";
import { applicationSchema, checkResumeFile, detectResumeKind, RESUME_MAX_BYTES, type ApplicationInput } from "./application";

// The server action imports "server-only" (which refuses to load outside the server): stub it here.
vi.mock("server-only", () => ({}));
const { submitApplication } = await import("@/server/careers-actions");

/** A complete, valid application with made-up details. */
const valid: ApplicationInput = {
  role: "software-engineer-java",
  firstName: "Alex",
  lastName: "Example",
  email: "alex@example.com",
  phone: "07700 900123",
  city: "Glasgow",
  rightToWork: "Yes",
  linkedin: "",
  educationLevel: "Bachelor's degree",
  institution: "Example University",
  subject: "Computer Science",
  graduationYear: "2024",
  experience: [{ title: "Developer", employer: "Example Ltd", start: "2024-09", end: "", summary: "" }],
  coverNote: "",
  consent: true,
};

const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0]);
const PDF = bytes(0x25, 0x50, 0x44, 0x46); // %PDF

function form(fields: object, file: File | null) {
  const body = new FormData();
  body.set("fields", JSON.stringify(fields));
  if (file) body.set("resume", file);
  return body;
}

describe("the application rules", () => {
  it("accepts a complete application and tidies the phone number", () => {
    const parsed = applicationSchema.parse(valid);
    expect(parsed.phone).toBe("07700900123");
    expect(parsed.graduationYear).toBe(2024);
  });

  it("requires consent", () => {
    expect(applicationSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejects a non-UK mobile number", () => {
    expect(applicationSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("rejects a job that ends before it starts", () => {
    const job = { ...valid.experience[0], start: "2024-09", end: "2023-01" };
    const result = applicationSchema.safeParse({ ...valid, experience: [job] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["experience", 0, "end"]);
  });

  it("allows no experience at all (apprenticeships) but not more than 5 roles", () => {
    expect(applicationSchema.safeParse({ ...valid, experience: [] }).success).toBe(true);
    const six = Array.from({ length: 6 }, () => valid.experience[0]);
    expect(applicationSchema.safeParse({ ...valid, experience: six }).success).toBe(false);
  });
});

describe("checking the CV", () => {
  it("knows PDF, Word (.docx) and old Word (.doc) by their first bytes", () => {
    expect(detectResumeKind(PDF)).toBe("pdf");
    expect(detectResumeKind(bytes(0x50, 0x4b, 0x03, 0x04))).toBe("docx");
    expect(detectResumeKind(bytes(0xd0, 0xcf, 0x11, 0xe0))).toBe("doc");
  });

  it("isn't fooled by a program renamed to cv.pdf", () => {
    expect(detectResumeKind(bytes(0x4d, 0x5a))).toBeNull(); // "MZ": a Windows program
  });

  it("checks size and file name before upload", () => {
    expect(checkResumeFile({ name: "cv.pdf", size: 1000 })).toBeNull();
    expect(checkResumeFile({ name: "cv.pdf", size: RESUME_MAX_BYTES + 1 })).toMatch(/5 MB/);
    expect(checkResumeFile({ name: "cv.exe", size: 1000 })).toMatch(/PDF or Word/);
    expect(checkResumeFile({ name: "cv.pdf", size: 0 })).toMatch(/empty/);
  });
});

describe("submitting an application (server action)", () => {
  it("accepts a valid application with a real PDF and returns a reference", async () => {
    const result = await submitApplication(form(valid, new File([PDF], "cv.pdf")));
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.reference).toMatch(/^STL-[0-9A-F]{8}$/);
  });

  it("re-checks the fields on the server, whatever the browser did", async () => {
    const result = await submitApplication(form({ ...valid, email: "not-an-email" }, new File([PDF], "cv.pdf")));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.email).toBeDefined();
  });

  it("refuses a file named .pdf that isn't really a PDF", async () => {
    const result = await submitApplication(form(valid, new File([bytes(0x4d, 0x5a)], "cv.pdf")));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.resume).toMatch(/doesn't look like/);
  });

  it("refuses a missing CV and a role that doesn't exist", async () => {
    expect((await submitApplication(form(valid, null))).ok).toBe(false);
    expect((await submitApplication(form({ ...valid, role: "astronaut" }, new File([PDF], "cv.pdf")))).ok).toBe(false);
  });
});
