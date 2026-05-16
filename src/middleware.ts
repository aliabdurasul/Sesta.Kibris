/**
 * Next.js Middleware — session refresh + pathname-scoped role protection.
 *
 * CRITICAL: Protected prefixes must use PATH BOUNDARIES so `/merchants` is NOT
 * treated as `/merchant/*` (substring trap with startsWith("/merchant")).
 *
 * Role redirects run ONLY when the request targets a protected dashboard prefix.
 * Public storefront and auth routes never trigger role-based redirects.
 *
 * LOOP PREVENTION (two guards):
 *
 *   Guard 1 — stale JWT:
 *     When a user is authenticated but app_metadata.role is missing from the
 *     JWT (e.g. courier created by admin but access token not yet refreshed),
 *     the middleware passes the request through to the Server Component.
 *     requireRole() in the layout has a DB fallback that resolves the role
 *     correctly. Redirecting to /auth/role-recovery here would cause a loop:
 *       login → /courier → role-recovery (middleware) → /courier (login page
 *       DB-resolved session) → role-recovery → ...
 *
 *   Guard 2 — already at destination:
 *     Before any role-mismatch redirect, verify the target path is not the
 *     same as the current path. If it is, pass through — the Server Component
 *     will resolve the role correctly via DB fallback. This catches any future
 *     edge cases that might cause middleware to redirect a user to where they
 *     already are.
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { userMustChangePassword } from "@/lib/auth/password-change";
import { roleHomeFromJwt } from "@/lib/routing/role-home";

/** Dashboard segments: pathname must be exactly `/${segment}` or `/${segment}/…`. */
const PROTECTED: { segment: string; role: string }[] = [
  { segment: "merchant", role: "merchant" },
  { segment: "courier", role: "courier" },
  { segment: "admin", role: "admin" },
  { segment: "customer", role: "customer" },
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/auth",
  "/merchants",
  "/markets",
  "/checkout",
  "/offline",
  "/setup-admin",
];

function pathMatchesProtectedSegment(pathname: string, segment: string): boolean {
  if (pathname === `/${segment}`) return true;
  return pathname.startsWith(`/${segment}/`);
}

function protectedMatch(pathname: string): { segment: string; role: string } | null {
  for (const p of PROTECTED) {
    if (pathMatchesProtectedSegment(pathname, p.segment)) return p;
  }
  return null;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.includes(".")) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const result = await updateSession(request);
    if (result instanceof NextResponse) return result;
    if ("response" in result) return result.response;
    return NextResponse.next();
  }

  const result = await updateSession(request);

  if (result instanceof NextResponse || !("user" in result)) {
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  const { response, user } = result;

  const gated = protectedMatch(pathname);

  // ── Not a protected dashboard route — never redirect by role ────────────
  if (!gated) {
    return response;
  }

  const requiredRole = gated.role;

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole =
    (user.app_metadata as Record<string, string> | undefined)?.["role"] ??
    null;

  if (
    userRole === "admin" &&
    userMustChangePassword(user) &&
    pathMatchesProtectedSegment(pathname, "admin")
  ) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = "/auth/setup-password";
    setupUrl.search = "";
    return NextResponse.redirect(setupUrl);
  }

  // ── GUARD 1: Stale JWT (app_metadata not yet refreshed) ─────────────────
  // The access token in the cookie may be valid but was issued before
  // admin set the role in app_metadata (e.g. newly created courier/merchant).
  // The JWT will not contain app_metadata.role until it is refreshed.
  //
  // DO NOT redirect to /auth/role-recovery here. Pass through to the Server
  // Component — requireRole() has a DB fallback that resolves the role.
  // Redirecting from middleware creates a loop:
  //   /courier → role-recovery (middleware, JWT null) →
  //   /auth/login (getSession DB-resolved) → /courier → loop
  if (!userRole) {
    return response;
  }

  // ── GUARD 2: Already at correct destination (anti-loop) ──────────────────
  // Before redirecting a role-mismatched user, verify the target path is not
  // the same as the current path. If it is, the Server Component will handle
  // the role check via DB fallback. This prevents any loop where the redirect
  // target equals the current path.
  if (userRole !== requiredRole) {
    const targetPath = roleHomeFromJwt(userRole);
    if (
      pathname === targetPath ||
      pathname.startsWith(targetPath + "/")
    ) {
      // User is already at their home path — pass through unconditionally.
      // The Server Component layout guard (requireRole) will handle this.
      return response;
    }
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.search = "";
    dashboardUrl.pathname = targetPath;
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
