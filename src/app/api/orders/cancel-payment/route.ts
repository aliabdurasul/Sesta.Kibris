/**
 * POST /api/orders/cancel-payment
 * Marks abandoned card checkout as canceled when user returns from Stripe.
 */
import { NextResponse } from "next/server";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let orderId: string | null = null;
  try {
    const body = (await request.json()) as { order_id?: string };
    orderId = typeof body.order_id === "string" ? body.order_id : null;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  const admin = createStripeAdminClient();
  await admin
    .from("orders")
    .update({ payment_status: "canceled" })
    .eq("id", orderId)
    .eq("payment_status", "requires_payment");

  return NextResponse.json({ ok: true });
}
