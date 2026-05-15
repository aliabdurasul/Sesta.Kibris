/**
 * POST /auth/signout — clears the session and redirects to home.
 * Called via a form with method="post" from any dashboard header.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", _request.url));
}
