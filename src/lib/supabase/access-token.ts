/**
 * Browser access token for Edge Function calls.
 * Uses getUser() first so the session is refreshed from cookies (SSR single source of truth).
 */
import { createBrowserClient } from "@/lib/supabase/client";

export async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
