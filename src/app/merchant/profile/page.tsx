import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { MerchantProfileForm } from "@/components/merchant/MerchantProfileForm";
import { parseOpeningHours } from "@/lib/market/onboarding";
import type { Database } from "@/types/database";

type MerchantProfileRow = Pick<
  Database["public"]["Tables"]["merchants"]["Row"],
  | "id"
  | "name"
  | "slug"
  | "logo_url"
  | "cover_image_url"
  | "description"
  | "profile_address"
  | "whatsapp_phone"
  | "opening_hours"
  | "delivery_time_min"
  | "delivery_time_max"
  | "delivery_fee"
  | "minimum_order_amount"
  | "is_onboarded"
>;

async function loadMerchantProfile(
  userId: string,
): Promise<MerchantProfileRow | null> {
  const supabase = await createServerClient();
  const select =
    "id, name, slug, logo_url, cover_image_url, description, profile_address, whatsapp_phone, opening_hours, delivery_time_min, delivery_time_max, delivery_fee, minimum_order_amount, is_onboarded";

  const { data } = await supabase
    .from("merchants")
    .select(select)
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as MerchantProfileRow;

  const { data: byOwner } = await supabase
    .from("merchants")
    .select(select)
    .eq("owner_user_id", userId)
    .maybeSingle();

  return (byOwner as MerchantProfileRow | null) ?? null;
}

export default async function MerchantProfilePage() {
  const session = await requireRole("merchant");
  const merchant = await loadMerchantProfile(session.id);

  if (!merchant) {
    return (
      <p className="text-sm text-gray-500">
        Market kaydı bulunamadı. Yöneticinizle iletişime geçin.
      </p>
    );
  }

  const hours = parseOpeningHours(merchant.opening_hours);

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/merchant"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Siparişler
        </Link>
        <h1 className="mt-2 text-lg font-bold text-gray-900">Mağaza profili</h1>
        <p className="text-sm text-gray-500">
          Logo, kapak görseli ve çalışma bilgilerinizi müşteriler görecek.
          URL slug değiştirilemez.
        </p>
        <Link
          href="/merchant/payments"
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Kartla ödeme ayarları →
        </Link>
      </div>

      <MerchantProfileForm
        merchant={{
          ...merchant,
          opening_hours: hours,
        }}
      />
    </div>
  );
}
