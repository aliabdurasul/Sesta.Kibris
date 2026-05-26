/**
 * Merchant payments settings — Stripe Connect + card acceptance toggle.
 */
import { createServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { MerchantPaymentsPanel } from "@/components/merchant/MerchantPaymentsPanel";

export const metadata = {
  title: "Ödemeler — Market Paneli",
};

export const dynamic = "force-dynamic";

export default async function MerchantPaymentsPage() {
  const session = await requireRole("merchant");
  const supabase = await createServerClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, accepts_online_payment")
    .eq("user_id", session.id)
    .maybeSingle();

  const acceptsOnline = Boolean(
    (merchant as { accepts_online_payment?: boolean } | null)?.accepts_online_payment,
  );

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödemeler</h1>
        <p className="text-sm text-gray-500">
          Kartla ödeme ve Stripe Connect ayarları
        </p>
      </div>
      <MerchantPaymentsPanel acceptsOnlinePayment={acceptsOnline} />
    </div>
  );
}
