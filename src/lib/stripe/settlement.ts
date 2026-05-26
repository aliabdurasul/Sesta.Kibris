/**
 * Offline merchant settlement helpers (platform holds funds; admin pays merchants).
 */
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export interface MerchantSettlementSummary {
  merchantId: string;
  merchantName: string;
  paidOrderCount: number;
  pendingSettlementKurus: number;
  settledOrderCount: number;
}

export async function getMerchantSettlementSummary(
  merchantId: string,
): Promise<{
  paidOrderCount: number;
  pendingSettlementKurus: number;
  settledOrderCount: number;
}> {
  const admin = createStripeAdminClient();

  const { data: paidOrders } = await admin
    .from("orders")
    .select("total_amount, merchant_settled_at")
    .eq("merchant_id", merchantId)
    .eq("payment_method", "card")
    .eq("payment_status", "paid");

  let pendingSettlementKurus = 0;
  let settledOrderCount = 0;

  for (const o of paidOrders ?? []) {
    if (o.merchant_settled_at) {
      settledOrderCount += 1;
    } else {
      pendingSettlementKurus += (o.total_amount as number) ?? 0;
    }
  }

  return {
    paidOrderCount: paidOrders?.length ?? 0,
    pendingSettlementKurus,
    settledOrderCount,
  };
}

export async function listMerchantSettlementTotals(): Promise<
  MerchantSettlementSummary[]
> {
  const admin = createStripeAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("merchant_id, total_amount, merchant_settled_at, merchants(name)")
    .eq("payment_method", "card")
    .eq("payment_status", "paid");

  const byMerchant = new Map<
    string,
    { name: string; pending: number; count: number; settled: number }
  >();

  for (const o of orders ?? []) {
    const mid = o.merchant_id as string;
    const name =
      (Array.isArray(o.merchants)
        ? o.merchants[0]?.name
        : (o.merchants as { name: string } | null)?.name) ?? mid;
    const row = byMerchant.get(mid) ?? {
      name,
      pending: 0,
      count: 0,
      settled: 0,
    };
    row.count += 1;
    if (o.merchant_settled_at) {
      row.settled += 1;
    } else {
      row.pending += (o.total_amount as number) ?? 0;
    }
    byMerchant.set(mid, row);
  }

  return [...byMerchant.entries()].map(([merchantId, v]) => ({
    merchantId,
    merchantName: v.name,
    paidOrderCount: v.count,
    pendingSettlementKurus: v.pending,
    settledOrderCount: v.settled,
  }));
}
