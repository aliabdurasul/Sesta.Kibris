/**
 * Resolve a market by public slug or legacy alias (merchant_slug_redirects).
 */
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

export type MarketDetail = Pick<
  MerchantRow,
  | "id"
  | "name"
  | "slug"
  | "user_id"
  | "owner_user_id"
  | "category"
  | "address"
  | "phone"
  | "is_active"
  | "is_open"
  | "delivery_mode"
  | "default_courier_id"
  | "logo_url"
  | "cover_image_url"
  | "description"
  | "opening_hours"
  | "delivery_time_min"
  | "delivery_time_max"
  | "delivery_fee"
  | "features"
  | "is_onboarded"
  | "is_demo_market"
  | "updated_by_merchant"
>;

const MERCHANT_SELECT =
  "id, name, slug, user_id, owner_user_id, category, address, phone, is_active, is_open, delivery_mode, default_courier_id, logo_url, cover_image_url, description, opening_hours, delivery_time_min, delivery_time_max, delivery_fee, features, is_onboarded, is_demo_market, updated_by_merchant";

export type ResolveMarketResult = {
  merchant: MarketDetail;
  canonicalSlug: string;
  isLegacyAlias: boolean;
};

export async function resolveMarketBySlug(
  slug: string,
  options: { allowInactive: boolean },
): Promise<ResolveMarketResult | null> {
  const supabase = await createServerClient();

  let query = supabase
    .from("merchants")
    .select(MERCHANT_SELECT)
    .eq("slug", slug);

  if (!options.allowInactive) {
    query = query.eq("is_active", true);
  }

  const { data: direct, error: directError } = await query.maybeSingle();

  if (directError) {
    log.error("market.resolve.direct", {
      slug,
      reason: directError.message,
      code: directError.code,
    });
    return null;
  }

  if (direct) {
    const merchant = direct as MarketDetail;
    return {
      merchant,
      canonicalSlug: merchant.slug,
      isLegacyAlias: false,
    };
  }

  const { data: aliasRow, error: aliasError } = await supabase
    .from("merchant_slug_redirects")
    .select("merchant_id")
    .eq("old_slug", slug)
    .maybeSingle();

  if (aliasError) {
    log.error("market.resolve.alias", {
      slug,
      reason: aliasError.message,
      code: aliasError.code,
    });
    return null;
  }

  const alias = aliasRow as { merchant_id: string } | null;
  if (!alias) return null;

  let merchantQuery = supabase
    .from("merchants")
    .select(MERCHANT_SELECT)
    .eq("id", alias.merchant_id);

  if (!options.allowInactive) {
    merchantQuery = merchantQuery.eq("is_active", true);
  }

  const { data: byId, error: byIdError } = await merchantQuery.maybeSingle();

  if (byIdError) {
    log.error("market.resolve.by_id", {
      slug,
      merchantId: alias.merchant_id,
      reason: byIdError.message,
    });
    return null;
  }

  if (!byId) return null;

  const merchant = byId as MarketDetail;
  return {
    merchant,
    canonicalSlug: merchant.slug,
    isLegacyAlias: true,
  };
}
