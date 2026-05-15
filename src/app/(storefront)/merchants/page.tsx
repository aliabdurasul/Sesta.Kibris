/**
 * Public merchant listing page — /merchants
 * Server Component: fetches active merchants from Supabase.
 * Fully public — no auth required.
 * Never throws — DB errors render empty state.
 */
import { createServerClient } from "@/lib/supabase/server";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { log } from "@/lib/logger";

export const metadata = {
  title: "Restoranlar — SestaKıbrıs",
};

import type { Database } from "@/types/database";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

// Revalidate every 60 seconds (merchant list changes slowly)
export const revalidate = 60;

async function getMerchants(): Promise<{
  merchants: Pick<
    Merchant,
    "id" | "name" | "slug" | "description" | "logo_url" | "average_delivery_minutes" | "minimum_order_amount"
  >[];
  error: string | null;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("merchants")
      .select("id, name, slug, description, logo_url, average_delivery_minutes, minimum_order_amount")
      .eq("is_active", true)
      .order("name");

    if (error) {
      log.error("merchants.list.fetch", { reason: error.message, code: error.code });
      return { merchants: [], error: error.message };
    }

    return {
      merchants: (data ?? []) as Pick<
        Merchant,
        "id" | "name" | "slug" | "description" | "logo_url" | "average_delivery_minutes" | "minimum_order_amount"
      >[],
      error: null,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("merchants.list.unexpected", { reason });
    return { merchants: [], error: reason };
  }
}

export default async function MerchantsPage() {
  const { merchants, error } = await getMerchants();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Restoranlar</h1>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          Restoranlar şu an yüklenemiyor. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {merchants.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg">Henüz aktif restoran bulunmuyor.</p>
          <p className="mt-1 text-sm">Yakında yeni restoranlar eklenecek.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {merchants.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
}
