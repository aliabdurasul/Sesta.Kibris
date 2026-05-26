/**
 * Whether a merchant can accept card payments at checkout.
 *
 * MIN-LAUNCH: cardAvailable = accepts_online_payment only.
 * Merchants do NOT need their own Stripe account.
 */
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export interface MerchantPaymentCapabilities {
  codAvailable: true;
  cardAvailable: boolean;
  acceptsOnlinePayment: boolean;
}

export async function getMerchantPaymentCapabilities(
  merchantId: string,
): Promise<MerchantPaymentCapabilities> {
  const admin = createStripeAdminClient();

  const { data: merchant } = await admin
    .from("merchants")
    .select("id, accepts_online_payment, is_active")
    .eq("id", merchantId)
    .maybeSingle();

  if (!merchant?.is_active) {
    return {
      codAvailable: true,
      cardAvailable: false,
      acceptsOnlinePayment: false,
    };
  }

  const acceptsOnline = Boolean(merchant.accepts_online_payment);

  return {
    codAvailable: true,
    cardAvailable: acceptsOnline,
    acceptsOnlinePayment: acceptsOnline,
  };
}
