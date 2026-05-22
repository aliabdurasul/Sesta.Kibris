import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import {
  resolveMarketDisplay,
  sortMerchantsForBrowse,
  type MerchantDisplaySource,
} from "@/lib/market/resolve-display";
import type { MarketDisplay } from "@/lib/market/resolve-display";
import type { Database } from "@/types/database";

export type PublicMerchantListItem = Pick<
  Database["public"]["Tables"]["merchants"]["Row"],
  | "id"
  | "name"
  | "slug"
  | "category"
  | "is_open"
  | "address"
  | "phone"
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

export type MarketCardMerchant = PublicMerchantListItem & {
  display: MarketDisplay;
  rating?: number | null;
  distanceKm?: number | null;
};

const PUBLIC_MERCHANT_SELECT =
  "id, name, slug, category, is_open, address, phone, logo_url, cover_image_url, description, opening_hours, delivery_time_min, delivery_time_max, delivery_fee, features, is_onboarded, is_demo_market, updated_by_merchant";

export async function getPublicMerchants(): Promise<{
  merchants: MarketCardMerchant[];
  error: string | null;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("merchants")
      .select(PUBLIC_MERCHANT_SELECT)
      .eq("is_active", true)
      .order("is_onboarded", { ascending: false })
      .order("is_demo_market", { ascending: true })
      .order("name");

    if (error) {
      log.error("merchants.list.fetch", {
        reason: error.message,
        code: error.code,
      });
      return { merchants: [], error: error.message };
    }

    const rows = (data ?? []) as PublicMerchantListItem[];
    const sorted = sortMerchantsForBrowse(rows);

    const merchants: MarketCardMerchant[] = sorted.map((row) => {
      const display = resolveMarketDisplay(row as MerchantDisplaySource);
      return {
        ...row,
        display,
        rating: display.rating,
      };
    });

    return { merchants, error: null };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("merchants.list.unexpected", { reason });
    return { merchants: [], error: reason };
  }
}
