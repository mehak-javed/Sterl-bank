import { z } from "zod";

/*
 * The rules for logging in and signing up, shared by the browser (instant, friendly errors) and,
 * from Story 2, by the Java API's own checks (the real gatekeeper).
 */

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter an email address like name@example.com").max(254));

export const loginSchema = z.object({
  email,
  // Login only checks that something was typed: telling an attacker which rule a guess broke
  // would leak information. The server decides whether the password is right.
  password: z.string().min(1, "Enter your password").max(PASSWORD_MAX),
});

const name = (label: string) =>
  z.string().trim().min(1, `Enter your ${label}`).max(50, `Keep your ${label} under 50 characters`);

export const signupSchema = z
  .object({
    firstName: name("first name"),
    lastName: name("last name"),
    email,
    // 12–128 characters, and passphrases (spaces) are welcome: length beats complexity rules.
    password: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`),
  })
  .superRefine(({ firstName, lastName, email, password }, ctx) => {
    // A password containing your own name or email is one of the first things attackers try.
    const lower = password.toLowerCase();
    const personal = [firstName, lastName, email.split("@")[0]].map((p) => p.trim().toLowerCase()).filter((p) => p.length >= 3);
    if (personal.some((p) => lower.includes(p))) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Don't use your name or email in your password" });
    }
  });

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: "Too short" | "Weak" | "Fair" | "Good" | "Strong" };

/**
 * A simple, honest strength guide for the meter under the password box. Length matters most;
 * mixing kinds of characters and using several words (a passphrase) add a little.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length < PASSWORD_MIN) return { score: 0, label: "Too short" };
  let score = 1;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (kinds >= 3 || password.trim().split(/\s+/).length >= 4) score++;
  const capped = Math.min(score, 4) as 1 | 2 | 3 | 4;
  return { score: capped, label: (["Weak", "Fair", "Good", "Strong"] as const)[capped - 1] };
}
