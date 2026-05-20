/**
 * Resolve merchant slug for the authenticated user (server-only).
 */
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MerchantSlugRow = Pick<
  Database["public"]["Tables"]["merchants"]["Row"],
  "id" | "slug" | "name"
>;

export async function getMerchantSlugForUser(
  userId: string,
): Promise<MerchantSlugRow | null> {
  const supabase = await createServerClient();

  const byUserId = await supabase
    .from("merchants")
    .select("id, slug, name")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserId.data) {
    return byUserId.data as MerchantSlugRow;
  }

  const byOwner = await supabase
    .from("merchants")
    .select("id, slug, name")
    .eq("owner_user_id", userId)
    .maybeSingle();

  return (byOwner.data as MerchantSlugRow | null) ?? null;
}

export function userOwnsMerchant(
  userId: string,
  merchant: { user_id?: string; owner_user_id?: string },
): boolean {
  return merchant.user_id === userId || merchant.owner_user_id === userId;
}
