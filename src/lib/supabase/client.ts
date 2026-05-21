/**
 * Browser-side Supabase client.
 *
 * Use this in Client Components ('use client').
 * Returns a new client instance on every call — safe for client components.
 * NEVER import serverEnv here; this runs in the browser.
 */
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { supabaseFetch } from "@/lib/supabase/fetch-config";

import type { Database } from "@/types/database";

export function createBrowserClient() {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { fetch: supabaseFetch },
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
