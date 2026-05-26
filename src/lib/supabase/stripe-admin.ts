/**
 * Service-role client for Stripe MVP tables.
 *
 * WHY separate from typed Database client:
 * New tables from migration 00044 are hand-added to database.ts; until
 * `pnpm db:types` is run against a migrated DB, Supabase generics can infer `never`.
 * This wrapper keeps Stripe code working without weakening types project-wide.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminServerClient } from "@/lib/supabase/admin";

export function createStripeAdminClient(): SupabaseClient {
  return createAdminServerClient() as unknown as SupabaseClient;
}
