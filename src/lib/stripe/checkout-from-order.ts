/**
 * Create a Stripe Hosted Checkout session for an existing order row.
 */
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createHostedCheckoutSession } from "@/lib/stripe/checkout";

export interface CheckoutFromOrderResult {
  url: string;
  sessionId: string;
  orderId: string;
}

export async function createCheckoutSessionForOrder(input: {
  orderId: string;
  merchantId: string;
  customerEmail?: string;
}): Promise<CheckoutFromOrderResult> {
  const admin = createStripeAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, merchant_id, total_amount, payment_status, payment_method")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  if (order.merchant_id !== input.merchantId) {
    throw new Error("Order merchant mismatch");
  }

  if (order.payment_method !== "card" || order.payment_status !== "requires_payment") {
    throw new Error("Order is not awaiting card payment");
  }

  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("product_name, unit_price, quantity")
    .eq("order_id", input.orderId);

  if (itemsError || !items?.length) {
    throw new Error("Order has no line items");
  }

  const lineItems = items.map((row) => ({
    name: row.product_name as string,
    unitAmountKurus: row.unit_price as number,
    quantity: row.quantity as number,
  }));

  const totalAmount = order.total_amount as number;

  const { sessionId, url } = await createHostedCheckoutSession({
    orderId: input.orderId,
    merchantId: input.merchantId,
    lineItems,
    totalAmountKurus: totalAmount,
    customerEmail: input.customerEmail,
  });

  await admin
    .from("orders")
    .update({ stripe_session_id: sessionId })
    .eq("id", input.orderId);

  return { url, sessionId, orderId: input.orderId };
}
