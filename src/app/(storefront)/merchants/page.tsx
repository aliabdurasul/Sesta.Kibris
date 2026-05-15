/**
 * Public merchant listing page — /merchants
 * Server Component: fetches active merchants from Supabase.
 * Fully public — no auth required.
 */
import { createServerClient } from "@/lib/supabase/server";
import { MerchantCard } from "@/components/merchant/MerchantCard";

export const metadata = {
  title: "Restoranlar — SestaKıbrıs",
};

import type { Database } from "@/types/database";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

// Revalidate every 60 seconds (merchant list changes slowly)
export const revalidate = 60;

async function getMerchants(): Promise<Pick<
  Merchant,
  "id" | "name" | "slug" | "description" | "logo_url" | "average_delivery_minutes" | "minimum_order_amount"
>[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug, description, logo_url, average_delivery_minutes, minimum_order_amount")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Failed to load merchants: ${error.message}`);
  return (data ?? []) as Pick<
    Merchant,
    "id" | "name" | "slug" | "description" | "logo_url" | "average_delivery_minutes" | "minimum_order_amount"
  >[];
}

export default async function MerchantsPage() {
  const merchants = await getMerchants();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Restoranlar</h1>

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
