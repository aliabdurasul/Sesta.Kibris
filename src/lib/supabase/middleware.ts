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

  // Refresh the session — do not remove this line
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
