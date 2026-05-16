/**
 * Service-role Supabase client for admin operational surfaces ONLY.
 *
 * SECURITY RULES:
 *   - NEVER import this in client components.
 *   - NEVER import this in middleware.
 *   - NEVER expose the returned client or its credentials client-side.
 *   - Use ONLY in Server Components, Server Actions, and Route Handlers
 *     that are guarded by requireRole("admin").
 *
 * Why service-role for admin:
 *   - Admin panel is operational tooling, not a customer surface.
 *   - RLS bypass is intentional — admins must see all data.
 *   - Avoids dependency on RLS migration state during stabilization.
 *   - Provides a clear, auditable boundary: admin surfaces use this client,
 *     all other surfaces use the anon-key server client with RLS enforced.
 *
 * Pattern:
 *   Admin UI → Server Component/Action → createAdminServerClient() → Supabase
 *   Customer/Merchant/Courier UI → createServerClient() → Supabase + RLS
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use only in admin server contexts.
 *
 * Throws if environment variables are missing rather than silently failing.
 */
export function createAdminServerClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Admin operations require both environment variables.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
