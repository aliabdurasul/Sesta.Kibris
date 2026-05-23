/**
 * POST /auth/signout — full session reset (Supabase + app cookies).
 * GET is supported so accidental navigation still signs out cleanly.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clearAuthSession } from "@/lib/auth/signout";
import type { Database } from "@/types/database";

async function handleSignOut(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!;

  const homeUrl = new URL("/", request.url);
  homeUrl.search = "";
  let response = NextResponse.redirect(homeUrl);

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

  await clearAuthSession({
    signOut: () => supabase.auth.signOut(),
    setCookie: (name, value, options) => {
      response.cookies.set(name, value, options);
    },
  });

  return response;
}

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}

export async function GET(request: NextRequest) {
  return handleSignOut(request);
}
