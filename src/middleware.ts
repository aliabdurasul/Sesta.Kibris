/**
 * Next.js Middleware — session refresh + pathname-scoped role protection.
 *
 * LOOP PREVENTION:
 *   Guard 1 — stale JWT: pass through when app_metadata.role is absent.
 *     requireRole() in layouts resolves via DB fallback.
 *   Guard 2 — already at destination: never redirect to the current path.
 *
 * HEADER FORWARDING (x-pathname):
 *   The pathname is forwarded to server components via extraRequestHeaders
 *   passed to updateSession(). This uses { request: { headers } } internally
 *   which preserves the original request body — critical for Server Actions.
 *
 *   DO NOT use `new NextRequest(url, { body: request.body })` here.
 *   ReadableStream bodies can only be consumed once. Cloning a NextRequest
 *   with the body and passing it to NextResponse.next({ request: clone })
 *   drops the body, causing Server Actions to crash with a digest error:
 *   "An error occurred in the Server Components render"
 */
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { userMustChangePassword } from "@/lib/auth/password-change";
import {
  GUEST_USER_ID_COOKIE,
  guestCookieOptions,
  isValidGuestUserId,
  newGuestUserId,
} from "@/lib/guest/session";
import { isGuestAllowedPath } from "@/lib/middleware/guest-paths";
import { roleHomeFromJwt } from "@/lib/routing/role-home";
import {
  ACTIVE_ROLE_COOKIE,
  activeRoleCookieOptions,
} from "@/lib/auth/session-cookies";
import { buildLoginRedirectPath } from "@/lib/routing/safe-path";
import { log } from "@/lib/logger";

const IS_DEV = process.env.NODE_ENV !== "production";

/** Dashboard segments: pathname must be exactly `/${segment}` or `/${segment}/…`. */
const PROTECTED: { segment: string; role: string }[] = [
  { segment: "merchant", role: "merchant" },
  { segment: "courier", role: "courier" },
  { segment: "admin", role: "admin" },
  { segment: "customer", role: "customer" },
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
  if (pathname.startsWith("/_next")) return true;
  return isGuestAllowedPath(pathname);
}

const ROOT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Copy Set-Cookie headers from one response onto another (e.g. cleared auth cookies). */
function mergeResponseCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

/** Persist anonymous guest id when no Supabase session (checkout traceability). */
function ensureGuestCookie(
  request: NextRequest,
  response: NextResponse,
  hasAuthUser: boolean,
): NextResponse {
  if (hasAuthUser) return response;
  const existing = request.cookies.get(GUEST_USER_ID_COOKIE)?.value;
  if (isValidGuestUserId(existing)) return response;
  response.cookies.set(GUEST_USER_ID_COOKIE, newGuestUserId(), guestCookieOptions());
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root page is app/page.tsx (GET → /merchants). Block write methods without route.ts conflict.
  if (pathname === "/" && ROOT_WRITE_METHODS.has(request.method)) {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "GET, HEAD" } },
    );
  }

  // Forward pathname to server components via request header.
  // updateSession uses { request: { headers } } internally — body is preserved.
  const pathnameHeader = { "x-pathname": pathname };

  // Sign-out must not refresh session — avoids race with cookie clearing.
  if (pathname === "/auth/signout") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isPublicPath(pathname)) {
    const result = await updateSession(request, pathnameHeader);
    if (result instanceof NextResponse) return result;
    if ("response" in result) {
      return ensureGuestCookie(request, result.response, !!result.user);
    }
    return NextResponse.next();
  }

  const result = await updateSession(request, pathnameHeader);

  if (result instanceof NextResponse || !("user" in result)) {
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  let { response, user } = result;
  response = ensureGuestCookie(request, response, !!user);

  const gated = protectedMatch(pathname);

  // ── Not a protected dashboard route — never redirect by role ─────────────
  if (!gated) {
    return ensureGuestCookie(request, response, !!user);
  }

  const requiredRole = gated.role;

  if (!user) {
    if (isGuestAllowedPath(pathname)) {
      return ensureGuestCookie(request, response, false);
    }
    const loginPath = buildLoginRedirectPath(pathname);
    log.info("auth.middleware.redirect", {
      from: pathname,
      to: loginPath,
      reason: "no_session",
    });
    const loginUrl = new URL(loginPath, request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return mergeResponseCookies(response, redirectResponse);
  }

  const userRole =
    (user.app_metadata as Record<string, string> | undefined)?.["role"] ??
    null;

  if (IS_DEV) {
    console.log(
      `[AUTH TRACE] middleware | path=${pathname} | jwt_role=${userRole ?? "null"} | required=${requiredRole}`,
    );
  }

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

  // ── GUARD 1: Stale JWT ───────────────────────────────────────────────────
  // app_metadata.role absent → pass through; requireRole() has DB fallback.
  if (!userRole) {
    if (IS_DEV) {
      console.log(`[AUTH TRACE] middleware | GUARD1 stale JWT | path=${pathname} → pass through`);
    }
    return response;
  }

  // ── GUARD 2: Role changed without re-login ───────────────────────────────
  const activeRole = request.cookies.get(ACTIVE_ROLE_COOKIE)?.value;
  if (userRole && activeRole && userRole !== activeRole) {
    if (IS_DEV) {
      console.log(
        `[AUTH TRACE] middleware | role cookie mismatch jwt=${userRole} cookie=${activeRole} → syncing cookie`,
      );
    }
    // Sync the cookie to match the valid JWT role to prevent redirect loops
    response.cookies.set(ACTIVE_ROLE_COOKIE, userRole, activeRoleCookieOptions());
  }

  // ── GUARD 3: Role mismatch ───────────────────────────────────────────────
  if (userRole !== requiredRole) {
    // JWT role may be stale; let the segment layout resolve via DB (requireRole).
    if (pathMatchesProtectedSegment(pathname, requiredRole)) {
      if (IS_DEV) {
        console.log(
          `[AUTH TRACE] middleware | GUARD3 jwt mismatch, path matches required segment | path=${pathname} → pass through`,
        );
      }
      return response;
    }

    const targetPath = roleHomeFromJwt(userRole);
    if (pathname === targetPath || pathname.startsWith(targetPath + "/")) {
      if (IS_DEV) {
        console.log(
          `[AUTH TRACE] middleware | GUARD3 already at jwt home | path=${pathname} → pass through`,
        );
      }
      return response;
    }

    log.info("auth.middleware.redirect", {
      from: pathname,
      to: targetPath,
      reason: "role_mismatch",
    });
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
