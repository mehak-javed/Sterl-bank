import { NextResponse, type NextRequest } from "next/server";
import { API_ORIGIN } from "@/lib/api-origin";
import { isProtected, redirectForRole } from "@/lib/auth/guard";

/**
 * The route guard (Next.js "proxy", formerly middleware): runs before a personal page is served.
 * It asks the Java API who the session belongs to; no valid session → the login page, which brings
 * the person back here afterwards (?next=). Checking with the API (not just "is there a cookie?")
 * means an expired or logged-out session can't open a page. If the API can't be reached, it fails
 * CLOSED: better a login page than showing someone's banking.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const session = request.cookies.get("SESSION");
  if (session) {
    try {
      const me = await fetch(`${API_ORIGIN}/api/auth/me`, {
        headers: { cookie: `SESSION=${session.value}` },
        cache: "no-store",
      });
      if (me.ok) {
        // Logged in. Now: is this page for THEIR role? (The API checks again on every request.)
        const { role } = (await me.json()) as { role: string };
        const elsewhere = redirectForRole(pathname, role);
        return elsewhere ? NextResponse.redirect(new URL(elsewhere, request.url)) : NextResponse.next();
      }
    } catch {
      // API unreachable: fall through to the login page.
    }
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

/** Only run for the personal banking pages (and never for static files or images). */
export const config = {
  matcher: ["/dashboard/:path*", "/accounts/:path*", "/transactions/:path*", "/payments/:path*", "/cards/:path*", "/markets/:path*", "/credit-risk/:path*"],
};
