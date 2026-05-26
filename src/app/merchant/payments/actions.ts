"use server";

/**
 * Merchant toggles card acceptance after Stripe Connect is ready.
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { getConnectAccountStatus } from "@/lib/stripe/connect";

export async function setAcceptsOnlinePayment(
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("merchant");
  const supabase = await createServerClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", session.id)
    .maybeSingle();

  if (!merchant) {
    return { ok: false, error: "Market bulunamadı." };
  }

  const merchantId = (merchant as { id: string }).id;

  if (enabled) {
    const admin = createStripeAdminClient();
    const { data: connectRow } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id")
      .eq("merchant_id", merchantId)
      .maybeSingle();

    if (!connectRow?.stripe_account_id) {
      return {
        ok: false,
        error: "Önce Stripe hesabınızı bağlayın.",
      };
    }

    const status = await getConnectAccountStatus(
      connectRow.stripe_account_id as string,
    );
    if (!status.readyToReceivePayments) {
      return {
        ok: false,
        error: "Stripe onboarding tamamlanmadan kart ödemesi açılamaz.",
      };
    }
  }

  const admin = createStripeAdminClient();
  const { error } = await admin
    .from("merchants")
    .update({ accepts_online_payment: enabled })
    .eq("id", merchantId)
    .eq("user_id", session.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/merchant/payments");
  revalidatePath("/connect");
  return { ok: true };
}
