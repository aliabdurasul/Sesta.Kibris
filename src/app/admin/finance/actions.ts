"use server";

/**
 * Admin marks a paid card order as settled with the merchant (offline payout).
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export async function markOrderSettled(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, payment_status, payment_method, merchant_settled_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { ok: false, error: "Sipariş bulunamadı." };
  }

  if (order.payment_method !== "card" || order.payment_status !== "paid") {
    return { ok: false, error: "Sadece ödenmiş kart siparişleri kapatılabilir." };
  }

  if (order.merchant_settled_at) {
    return { ok: true };
  }

  const { error } = await admin
    .from("orders")
    .update({ merchant_settled_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function markMerchantOrdersSettled(
  merchantId: string,
): Promise<{ ok: boolean; count: number; error?: string }> {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const { data: orders, error: fetchError } = await admin
    .from("orders")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("payment_method", "card")
    .eq("payment_status", "paid")
    .is("merchant_settled_at", null);

  if (fetchError) {
    return { ok: false, count: 0, error: fetchError.message };
  }

  const ids = (orders ?? []).map((o) => o.id as string);
  if (!ids.length) {
    return { ok: true, count: 0 };
  }

  const settledAt = new Date().toISOString();
  const { error } = await admin
    .from("orders")
    .update({ merchant_settled_at: settledAt })
    .in("id", ids);

  if (error) {
    return { ok: false, count: 0, error: error.message };
  }

  revalidatePath("/admin/finance");
  return { ok: true, count: ids.length };
}
