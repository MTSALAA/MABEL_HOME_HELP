import { getSessionCookie } from "better-auth/cookies";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_COOKIE_PREFIX } from "./lib/constants";

const handleI18n = createIntlMiddleware(routing);

const ADMIN_PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isPublic = ADMIN_PUBLIC_PATHS.some((path) =>
      pathname.startsWith(path),
    );
    // Optimistic check only: every admin page and action re-validates the
    // session against the database.
    if (!isPublic && !getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return handleI18n(request);
}

export const config = {
  // Everything except API routes, Next internals, the generated touch icon
  // and files with an extension.
  matcher: ["/((?!api|_next|_vercel|apple-icon|.*\\..*).*)"],
};
