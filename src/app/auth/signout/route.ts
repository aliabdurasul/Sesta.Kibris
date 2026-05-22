/**
 * POST /auth/signout — full session reset (Supabase + app cookies).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clearSessionAuxCookies,
} from "@/lib/auth/session-cookies";
import type { Database } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!;

  let response = NextResponse.redirect(new URL("/", request.url));

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.signOut();

  clearSessionAuxCookies((name, value, options) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
