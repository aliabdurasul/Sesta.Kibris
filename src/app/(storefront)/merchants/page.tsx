/**
 * Public merchant listing — /merchants
 * Queries only columns that exist on merchants (migration 00001 + 00016).
 */
import { createServerClient } from "@/lib/supabase/server";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Marketler — SestaKıbrıs",
};

type MerchantListItem = Pick<
  Database["public"]["Tables"]["merchants"]["Row"],
  "id" | "name" | "slug" | "category" | "is_open" | "address" | "phone"
>;

export const dynamic = "force-dynamic";

async function getMerchants(): Promise<{
  merchants: MerchantListItem[];
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

    return { merchants: (data ?? []) as MerchantListItem[], error: null };
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
      <h1 className="mb-4 text-xl font-bold text-gray-900">Marketler</h1>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          Marketler şu an yüklenemiyor. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {merchants.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg">Henüz aktif market bulunmuyor.</p>
          <p className="mt-1 text-sm">
            Marketler yönetici tarafından aktifleştirildikten sonra burada görünür.
          </p>
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
