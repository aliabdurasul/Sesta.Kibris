/**
 * Next.js Middleware — session refresh + pathname-scoped role protection.
 *
 * CRITICAL: Protected prefixes must use PATH BOUNDARIES so `/merchants` is NOT
 * treated as `/merchant/*` (substring trap with startsWith("/merchant")).
 *
 * Role redirects run ONLY when the request targets a protected dashboard prefix.
 * Public storefront and auth routes never trigger role-based redirects.
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
  "/staff",
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

  if (!userRole) {
    const recoveryUrl = request.nextUrl.clone();
    recoveryUrl.pathname = "/auth/role-recovery";
    recoveryUrl.search = "";
    return NextResponse.redirect(recoveryUrl);
  }

  if (userRole !== requiredRole) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.search = "";
    dashboardUrl.pathname = roleHomeFromJwt(userRole);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
