/**
 * Merchant payments — platform model (MIN-LAUNCH).
 */
import { createServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { MerchantPaymentsPanel } from "@/components/merchant/MerchantPaymentsPanel";
import { getMerchantSettlementSummary } from "@/lib/stripe/settlement";

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

  if (!merchant) {
    return (
      <p className="text-sm text-gray-500">
        Market kaydı bulunamadı.
      </p>
    );
  }

  const merchantId = (merchant as { id: string }).id;
  const acceptsOnline = Boolean(
    (merchant as { accepts_online_payment?: boolean }).accepts_online_payment,
  );

  const summary = await getMerchantSettlementSummary(merchantId);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödemeler</h1>
        <p className="text-sm text-gray-500">
          Kartla ödeme ve hakediş durumu
        </p>
      </div>
      <MerchantPaymentsPanel
        acceptsOnlinePayment={acceptsOnline}
        paidOrderCount={summary.paidOrderCount}
        pendingSettlementKurus={summary.pendingSettlementKurus}
      />
    </div>
  );
}
