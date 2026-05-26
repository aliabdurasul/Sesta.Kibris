/**
 * POST /api/stripe/checkout/create-from-cart
 *
 * Real marketplace card checkout:
 * 1. create-order edge (payment_method=card)
 * 2. Stripe Hosted Checkout session from order line items
 * 3. redirect URL for customer
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyCreateOrder } from "@/lib/orders/proxy-create-order";
import { getMerchantPaymentCapabilities } from "@/lib/stripe/payment-capabilities";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createCheckoutSessionForOrder } from "@/lib/stripe/checkout-from-order";
import { persistGuestOrderToken } from "@/lib/orders/fetch-guest-order";
import { guestCookieOptions } from "@/lib/guest/session";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const merchantId =
    typeof rawBody["merchant_id"] === "string" ? rawBody["merchant_id"] : null;

  if (!merchantId) {
    return NextResponse.json(
      { error: "Market kimliği gerekli.", code: "INVALID_MERCHANT_ID" },
      { status: 400 },
    );
  }

  const capabilities = await getMerchantPaymentCapabilities(merchantId);
  if (!capabilities.cardAvailable) {
    return NextResponse.json(
      {
        error: "Bu market kartla ödeme kabul etmiyor.",
        code: "CARD_NOT_AVAILABLE",
      },
      { status: 400 },
    );
  }

  const created = await proxyCreateOrder(request, rawBody, {
    forcePaymentMethod: "card",
  });

  if (!created.ok) {
    return NextResponse.json(created.body, { status: created.status });
  }

  const admin = createStripeAdminClient();
  const { data: connectRow } = await admin
    .from("merchant_stripe_accounts")
    .select("stripe_account_id")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (!connectRow?.stripe_account_id) {
    return NextResponse.json(
      { error: "Stripe hesabı bulunamadı.", code: "STRIPE_NOT_CONNECTED" },
      { status: 400 },
    );
  }

  const customerEmail =
    typeof rawBody["guest_email"] === "string"
      ? rawBody["guest_email"].trim()
      : undefined;

  try {
    const { url, sessionId, orderId } = await createCheckoutSessionForOrder({
      orderId: created.orderId,
      merchantId,
      connectedAccountId: connectRow.stripe_account_id,
      customerEmail: customerEmail || undefined,
    });

    if (
      created.authMode === "guest" &&
      created.guestToken
    ) {
      await persistGuestOrderToken(orderId, created.guestToken);
    }

    log.info("stripe.checkout.from_cart", {
      orderId,
      merchantId,
      sessionId,
    });

    const response = NextResponse.json({
      url,
      order_id: orderId,
      session_id: sessionId,
      authMode: created.authMode,
    });

    if (created.authMode === "guest" && created.guestUserId) {
      response.cookies.set(
        "guest_user_id",
        created.guestUserId,
        guestCookieOptions(),
      );
    }

    return response;
  } catch (err) {
    log.error("stripe.checkout.session_failed", {
      orderId: created.orderId,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      {
        error: "Ödeme sayfası oluşturulamadı.",
        code: "CHECKOUT_SESSION_FAILED",
      },
      { status: 500 },
    );
  }
}
