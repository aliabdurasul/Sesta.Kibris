/**
 * Supabase session refresh helper for Next.js middleware.
 *
 * Refreshes the user's session cookie on every request to prevent
 * premature token expiry. This is the only place where cookies are
 * written from middleware.
 *
 * BODY PRESERVATION:
 *   Uses `NextResponse.next({ request: { headers } })` — NOT
 *   `NextResponse.next({ request: fullNextRequest })`.
 *
 *   Passing a full NextRequest object (especially one cloned with new NextRequest())
 *   can drop the ReadableStream body because streams can only be consumed once.
 *   Server Actions are POST requests whose arguments live in the body — if the
 *   body is consumed or dropped by middleware, the action crashes with:
 *   "An error occurred in the Server Components render" (digest error).
 *
 *   The `{ request: { headers } }` pattern tells Next.js to forward the
 *   original request body unchanged while only overriding the headers.
 *
 * EXTRA HEADERS:
 *   Callers can pass extraRequestHeaders (e.g. x-pathname) which are merged
 *   into the forwarded request headers without touching the body.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACTIVE_ROLE_COOKIE,
  activeRoleCookieOptions,
  clearSessionAuxCookies,
} from "@/lib/auth/session-cookies";
import { supabaseFetch } from "@/lib/supabase/fetch-config";

import type { Database } from "@/types/database";

export async function updateSession(
  request: NextRequest,
  extraRequestHeaders?: Record<string, string>,
) {
  // Merge original headers with any extras.
  // IMPORTANT: use `{ request: { headers } }` not `{ request: clonedRequest }`
  // so Next.js preserves the original body (required for Server Actions).
  const requestHeaders = new Headers(request.headers);
  if (extraRequestHeaders) {
    for (const [key, value] of Object.entries(extraRequestHeaders)) {
      requestHeaders.set(key, value);
    }
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { fetch: supabaseFetch },
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Recreate response preserving the same headers pattern
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session from cookies only — never trust in-memory client state
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Stale refresh token → clear auth cookies to stop AuthApiError loops
  if (userError) {
    const msg = userError.message.toLowerCase();
    const code = (userError as { code?: string }).code?.toLowerCase() ?? "";
    const isStaleSession =
      code.includes("refresh_token") ||
      msg.includes("refresh token") ||
      msg.includes("refresh_token_not_found") ||
      msg.includes("invalid") ||
      userError.status === 401;

    if (isStaleSession) {
      await supabase.auth.signOut();
      clearSessionAuxCookies((name, value, options) => {
        supabaseResponse.cookies.set(name, value, options);
      });
    }
  }

  return {
    response: supabaseResponse,
    user: userError ? null : user,
    supabase,
  };
}
