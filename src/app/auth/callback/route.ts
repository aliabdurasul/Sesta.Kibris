/**
 * GET /auth/callback — OAuth / email-link PKCE callback.
 *
 * Exchanges `code` for a session and sets cookies. Does NOT assign roles
 * or perform business logic beyond choosing a safe redirect target.
 *
 * Configure Supabase Dashboard → Authentication → URL Configuration:
 *   Redirect URLs must include: /auth/callback, /auth/setup-password
 *
 * Email templates may pass ?next=/admin (optional); unsafe values are ignored.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import { userMustChangePassword } from "@/lib/auth/password-change";
import { roleHomeFromJwt } from "@/lib/routing/role-home";
import { setActiveRoleCookie } from "@/lib/auth/session-cookies";

function isSafeInternalPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Avoid callback loops
  if (path.startsWith("/auth/callback")) return false;
  return true;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");

  const loginError = NextResponse.redirect(
    new URL("/auth/login?error=callback", origin),
  );

  if (!code) {
    return loginError;
  }

  const cookieStore = await cookies();

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseAnonKey) {
    return loginError;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Cookie write can fail in edge cases — caller gets login error path
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginError;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return loginError;
  }

  if (userMustChangePassword(user)) {
    return NextResponse.redirect(new URL("/auth/setup-password", origin));
  }

  const role = (user.app_metadata as Record<string, string> | undefined)?.[
    "role"
  ];
  if (role) {
    const response = isSafeInternalPath(nextParam)
      ? NextResponse.redirect(new URL(nextParam, origin))
      : NextResponse.redirect(new URL(roleHomeFromJwt(role), origin));
    setActiveRoleCookie((name, value, options) => {
      response.cookies.set(name, value, options);
    }, role);
    return response;
  }

  if (isSafeInternalPath(nextParam)) {
    return NextResponse.redirect(new URL(nextParam, origin));
  }

  const dest = roleHomeFromJwt(null);
  return NextResponse.redirect(new URL(dest, origin));
}
