/**
 * POST /api/stripe/checkout/create-session — demo storefront (platform payments).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createCheckoutSessionForOrder } from "@/lib/stripe/checkout-from-order";
import { getMerchantPaymentCapabilities } from "@/lib/stripe/payment-capabilities";
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
      .select("id, merchant_id, name, unit_amount, is_active")
      .eq("id", stripe_product_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const caps = await getMerchantPaymentCapabilities(product.merchant_id);
    if (!caps.cardAvailable) {
      return NextResponse.json(
        { error: "Merchant card payments not enabled" },
        { status: 400 },
      );
    }

    const lineTotal = product.unit_amount * quantity;
    const addressSnapshot = delivery_address ?? {
      full_address: "Online order",
      district: "N/A",
    };

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        merchant_id: product.merchant_id,
        customer_id: null,
        guest_user_id: crypto.randomUUID(),
        status: "PENDING",
        total_amount: lineTotal,
        delivery_address: addressSnapshot,
        payment_method: "card",
        payment_status: "requires_payment",
        guest_email: customer_email ?? null,
        guest_name: "Online Customer",
        guest_phone: "0000000000",
      })
      .select("id")
      .single();

    if (orderError || !order) {
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

    const { url, sessionId } = await createCheckoutSessionForOrder({
      orderId: order.id,
      merchantId: product.merchant_id,
      customerEmail: customer_email,
    });

    return NextResponse.json({ url, order_id: order.id, session_id: sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    log.error("stripe.checkout.failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
