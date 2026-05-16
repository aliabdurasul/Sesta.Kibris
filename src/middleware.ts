/**
 * Next.js Middleware — runs on every request before rendering.
 *
 * Responsibilities:
 *   1. Refresh Supabase session cookies (prevents premature token expiry)
 *   2. Enforce role-based route protection
 *   3. Redirect unauthenticated users to /auth/login
 *   4. Redirect role mismatches to their correct dashboard
 *   5. Redirect users with no role to /auth/role-recovery (no loop)
 *
 * Loop-prevention rules:
 *   - /auth/* routes are ALWAYS allowed through (no redirect)
 *   - /merchants/* routes are ALWAYS allowed through (public storefront)
 *   - /checkout is allowed through (auth check happens server-side)
 *   - /api/* routes are ALWAYS skipped
 *   - Static files are ALWAYS skipped
 *   - /staff is NOT linked in customer UI (internal ops route)
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { userMustChangePassword } from "@/lib/auth/password-change";

// Routes requiring a specific role
const PROTECTED_ROUTES: Record<string, string> = {
  "/merchant": "merchant",
  "/courier": "courier",
  "/admin": "admin",
  "/customer": "customer",
};

// Routes that are ALWAYS public — never redirect, never require auth
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/auth",         // all auth pages (login, register, signout, role-recovery)
  "/merchants",    // public storefront
  "/checkout",     // auth check handled server-side in page
  "/staff",        // internal ops login hub — not customer-facing, no redirect loop
  "/offline",      // PWA offline fallback
  "/setup-admin",  // first-run wizard — must be public, checks admin existence server-side
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.includes(".")) return true; // static files (favicon, images, etc.)
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Always pass through public paths ──────────────────────────────────
  if (isPublicPath(pathname)) {
    // Still refresh the session cookie so Supabase doesn't expire
    const result = await updateSession(request);
    if (result instanceof NextResponse) return result;
    if ("response" in result) return result.response;
    return NextResponse.next();
  }

  // ── 2. Refresh session and get user ──────────────────────────────────────
  const result = await updateSession(request);

  if (result instanceof NextResponse || !("user" in result)) {
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  const { response, user } = result;

  // ── 3. Check if this is a protected route ────────────────────────────────
  const protectedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
    pathname.startsWith(prefix),
  );

  // Not a protected route — allow through
  if (!protectedPrefix) {
    return response;
  }

  const requiredRole = PROTECTED_ROUTES[protectedPrefix]!;

  // ── 4. Not authenticated → login (with return URL) ───────────────────────
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Get role from JWT app_metadata ────────────────────────────────────
  // NOTE: DB fallback only runs in server components / actions, not here.
  // Middleware reads the JWT claim only (no DB calls in middleware = fast).
  // If role is missing in JWT, redirect to role-recovery.
  const userRole =
    (user.app_metadata as Record<string, string> | undefined)?.["role"] ??
    null;

  // ── 5b. Admin must finish bootstrap password change before /admin ─────────
  if (
    userRole === "admin" &&
    userMustChangePassword(user) &&
    pathname.startsWith("/admin")
  ) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = "/auth/setup-password";
    setupUrl.search = "";
    return NextResponse.redirect(setupUrl);
  }

  if (!userRole) {
    // Authenticated but no role in JWT — send to recovery, not login (avoids loop)
    const recoveryUrl = request.nextUrl.clone();
    recoveryUrl.pathname = "/auth/role-recovery";
    recoveryUrl.search = "";
    return NextResponse.redirect(recoveryUrl);
  }

  // ── 6. Role mismatch → correct dashboard ─────────────────────────────────
  if (userRole !== requiredRole) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.search = "";

    switch (userRole) {
      case "merchant":
        dashboardUrl.pathname = "/merchant";
        break;
      case "courier":
        dashboardUrl.pathname = "/courier";
        break;
      case "admin":
        dashboardUrl.pathname = "/admin";
        break;
      case "customer":
        dashboardUrl.pathname = "/customer/orders";
        break;
      default:
        dashboardUrl.pathname = "/auth/role-recovery";
    }

    return NextResponse.redirect(dashboardUrl);
  }

  // ── 7. All checks passed — allow through ─────────────────────────────────
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
