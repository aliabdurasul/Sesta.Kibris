/**
 * Whether a merchant can accept card payments at checkout.
 * Used by checkout UI and create-from-cart API.
 */
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { getConnectAccountStatus, type ConnectUiStatus } from "@/lib/stripe/connect";

export interface MerchantPaymentCapabilities {
  codAvailable: true;
  cardAvailable: boolean;
  acceptsOnlinePayment: boolean;
  stripeConnected: boolean;
  readyToReceivePayments: boolean;
  stripeUiStatus: ConnectUiStatus | null;
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
      stripeConnected: false,
      readyToReceivePayments: false,
      stripeUiStatus: null,
    };
  }

  const acceptsOnline = Boolean(merchant.accepts_online_payment);

  const { data: connectRow } = await admin
    .from("merchant_stripe_accounts")
    .select("stripe_account_id")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (!connectRow?.stripe_account_id) {
    return {
      codAvailable: true,
      cardAvailable: false,
      acceptsOnlinePayment: acceptsOnline,
      stripeConnected: false,
      readyToReceivePayments: false,
      stripeUiStatus: null,
    };
  }

  const status = await getConnectAccountStatus(connectRow.stripe_account_id);

  const cardAvailable =
    acceptsOnline && status.readyToReceivePayments;

  return {
    codAvailable: true,
    cardAvailable,
    acceptsOnlinePayment: acceptsOnline,
    stripeConnected: true,
    readyToReceivePayments: status.readyToReceivePayments,
    stripeUiStatus: status.uiStatus,
  };
}
