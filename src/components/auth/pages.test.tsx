import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { default: LoginPage } = await import("@/app/(auth)/login/page");
const { default: SignUpPage } = await import("@/app/(auth)/signup/page");
const { default: AuthLayout } = await import("@/app/(auth)/layout");

describe("log in and sign up pages", () => {
  it("log in asks for email and password only", () => {
    const html = renderToStaticMarkup(<LoginPage />);
    expect(html.match(/<input/g)).toHaveLength(2);
    expect(html).toContain("current-password");
  });

  it("sign up asks for first name, last name, email and password only", () => {
    const html = renderToStaticMarkup(<SignUpPage />);
    expect(html.match(/<input/g)).toHaveLength(4);
    for (const label of ["First name", "Last name", "Email", "Password"]) expect(html).toContain(`>${label}</label>`);
  });

  it("has no repeated Log in / Sign up buttons or menu in the layout (only the logo)", () => {
    const html = renderToStaticMarkup(<AuthLayout>{null}</AuthLayout>);
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain('href="/signup"');
    expect(html).toContain('href="/"');
  });
});
