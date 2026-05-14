/**
 * Next.js Proxy (formerly Middleware) — runs on every request before rendering.
 *
 * Responsibilities:
 * 1. Refresh Supabase session cookies (prevents premature token expiry)
 * 2. Enforce role-based route protection
 * 3. Redirect unauthenticated users to /auth/login
 * 4. Redirect role mismatches to their correct dashboard
 *
 * Per AUTH_AND_ROLES.md section 4 and PHASE_0_SETUP.md.
 */
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Route → required role mapping
const PROTECTED_ROUTES: Record<string, string> = {
  "/merchant": "merchant",
  "/courier": "courier",
  "/admin": "admin",
  "/customer": "customer",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Refresh the session and get current user
  const result = await updateSession(request);

  // If updateSession returned early (missing env vars in dev), pass through
  if (result instanceof NextResponse || !("user" in result)) {
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  const { response, user } = result;

  // Determine if this is a protected route
  const protectedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
    pathname.startsWith(prefix),
  );

  // Not a protected route — allow through
  if (!protectedPrefix) {
    return response;
  }

  const requiredRole = PROTECTED_ROUTES[protectedPrefix];

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get role from JWT app_metadata (server-authoritative — never trust client)
  const userRole =
    (user.app_metadata as Record<string, string> | undefined)?.["role"] ?? null;

  // Role mismatch — redirect to their correct dashboard
  if (userRole !== requiredRole) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("redirectTo");

    switch (userRole) {
      case "merchant":
        redirectUrl.pathname = "/merchant";
        break;
      case "courier":
        redirectUrl.pathname = "/courier";
        break;
      case "admin":
        redirectUrl.pathname = "/admin";
        break;
      case "customer":
        redirectUrl.pathname = "/customer/orders";
        break;
      default:
        redirectUrl.pathname = "/auth/login";
    }

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
