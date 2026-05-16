/**
 * Next.js proxy (route protection + session refresh).
 *
 * Only enforces auth/role on protected dashboard prefixes:
 *   /admin/*, /merchant/*, /courier/*, /customer/*
 *
 * Public storefront (/merchants, /, /checkout, /auth/*) is always reachable
 * regardless of role — no global "send courier to /courier" redirects.
 */
import { NextResponse, type NextRequest } from "next/server";

import { userMustChangePassword } from "@/lib/auth/password-change";
import {
  getProtectedRoleForPath,
  isPublicPath,
  roleHome,
} from "@/lib/routing";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const result = await updateSession(request);
    if (result instanceof NextResponse) return result;
    if ("response" in result) return result.response;
    return NextResponse.next();
  }

  const requiredRole = getProtectedRoleForPath(pathname);

  const result = await updateSession(request);

  if (result instanceof NextResponse || !("user" in result)) {
    return result instanceof NextResponse ? result : NextResponse.next();
  }

  const { response, user } = result;

  if (!requiredRole) {
    return response;
  }

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
    pathname.startsWith("/admin")
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
    dashboardUrl.pathname = roleHome(userRole);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
