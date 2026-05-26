/**
 * POST /api/stripe/checkout/create-session
 *
 * Flow:
 * 1. Validate product belongs to merchant with active Connect account
 * 2. Create order (PENDING, payment_method=card, payment_status=requires_payment)
 * 3. Create Stripe Checkout Session (destination charge + 10% fee)
 * 4. Return redirect URL
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createHostedCheckoutSession } from "@/lib/stripe/checkout";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { applicationFeeAmount } from "@/lib/stripe/helpers";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  stripe_product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  customer_email: z.string().email().optional(),
  delivery_address: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { stripe_product_id, quantity, customer_email, delivery_address } =
      parsed.data;

    const admin = createStripeAdminClient();

    const { data: product } = await admin
      .from("stripe_products")
      .select("id, merchant_id, name, unit_amount, stripe_price_id, is_active")
      .eq("id", stripe_product_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: connectRow } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id")
      .eq("merchant_id", product.merchant_id)
      .maybeSingle();

    if (!connectRow?.stripe_account_id) {
      return NextResponse.json(
        { error: "Merchant cannot accept card payments yet" },
        { status: 400 },
      );
    }

    const connectStatus = await getConnectAccountStatus(connectRow.stripe_account_id);
    if (!connectStatus.readyToReceivePayments) {
      return NextResponse.json(
        { error: "Merchant Stripe onboarding is not complete" },
        { status: 400 },
      );
    }

    const lineTotal = product.unit_amount * quantity;
    const totalAmount = lineTotal;
    const commission = applicationFeeAmount(totalAmount);

    const addressSnapshot = delivery_address ?? {
      full_address: "Online order — address collected at checkout",
      district: "N/A",
    };

    const guestUserId = crypto.randomUUID();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        merchant_id: product.merchant_id,
        customer_id: null,
        guest_user_id: guestUserId,
        status: "PENDING",
        total_amount: totalAmount,
        delivery_address: addressSnapshot,
        payment_method: "card",
        payment_status: "requires_payment",
        commission_amount: commission,
        guest_email: customer_email ?? null,
        guest_name: "Online Customer",
        guest_phone: "0000000000",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      log.error("stripe.checkout.order_insert_failed", { reason: orderError?.message });
      return NextResponse.json({ error: "Could not create order" }, { status: 500 });
    }

    await admin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      unit_price: product.unit_amount,
      quantity,
      line_total: lineTotal,
    });

    await admin.from("order_status_log").insert({
      order_id: order.id,
      from_status: null,
      to_status: "PENDING",
      actor_role: "guest",
      note: "Card checkout started — awaiting Stripe payment",
    });

    const { url, sessionId } = await createHostedCheckoutSession({
      orderId: order.id,
      merchantId: product.merchant_id,
      connectedAccountId: connectRow.stripe_account_id,
      totalAmountKurus: totalAmount,
      customerEmail: customer_email,
      lineItems: [
        {
          name: product.name,
          unitAmountKurus: product.unit_amount,
          quantity,
        },
      ],
    });

    await admin
      .from("orders")
      .update({ stripe_session_id: sessionId })
      .eq("id", order.id);

    return NextResponse.json({ url, order_id: order.id, session_id: sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    log.error("stripe.checkout.failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
