import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

export type PublicMerchantListItem = Pick<
  Database["public"]["Tables"]["merchants"]["Row"],
  "id" | "name" | "slug" | "category" | "is_open" | "address" | "phone"
>;

export async function getPublicMerchants(): Promise<{
  merchants: MarketCardMerchant[];
  error: string | null;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("merchants")
      .select("id, name, slug, category, is_open, address, phone")
      .eq("is_active", true)
      .order("name");

    if (error) {
      log.error("merchants.list.fetch", {
        reason: error.message,
        code: error.code,
      });
      return { merchants: [], error: error.message };
    }

    return {
      merchants: (data ?? []) as PublicMerchantListItem[],
      error: null,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("merchants.list.unexpected", { reason });
    return { merchants: [], error: reason };
  }
}
