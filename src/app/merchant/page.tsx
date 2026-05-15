/**
 * Merchant dashboard — /merchant
 * Shows PENDING + active orders for this merchant.
 * Realtime subscription added in Stage 1I.
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { MerchantOrderQueue } from "@/components/merchant/MerchantOrderQueue";

import type { Database, OrderStatus, Json } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

async function getMerchantId(userId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Pick<MerchantRow, "id"> | null)?.id ?? null;
}

async function getActiveOrders(merchantId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, delivery_address, notes, created_at,
       order_items(id, quantity, unit_price, snapshot)`,
    )
    .eq("merchant_id", merchantId)
    .in("status", ["PENDING", "CONFIRMED", "READY"])
    .order("created_at", { ascending: true });
  return (data ?? []) as (Pick<
    OrderRow,
    "id" | "status" | "total_amount" | "delivery_address" | "notes" | "created_at"
  > & { order_items: Pick<OrderItemRow, "id" | "quantity" | "unit_price" | "snapshot">[] })[];
}

export default async function MerchantDashboard() {
  const session = await requireRole("merchant");
  const merchantId = await getMerchantId(session.id);

  if (!merchantId) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p>Market kaydınız bulunamadı.</p>
      </div>
    );
  }

  const orders = await getActiveOrders(merchantId);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        Aktif Siparişler
        {orders.length > 0 && (
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-700">
            {orders.length}
          </span>
        )}
      </h2>

      <MerchantOrderQueue
        initialOrders={orders}
        merchantId={merchantId}
      />
    </div>
  );
}
