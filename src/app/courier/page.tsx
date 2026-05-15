/**
 * Courier dashboard — /courier
 * Shows orders ASSIGNED or IN_TRANSIT for this courier.
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CourierDeliveryQueue } from "@/components/courier/CourierDeliveryQueue";

import type { Database, OrderStatus, Json } from "@/types/database";

type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

async function getCourierId(userId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("couriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Pick<CourierRow, "id"> | null)?.id ?? null;
}

async function getAssignedOrders(courierId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, delivery_address, notes, created_at,
       merchants(name, address, phone),
       order_items(id, quantity, snapshot)`,
    )
    .eq("courier_id", courierId)
    .in("status", ["ASSIGNED", "IN_TRANSIT"])
    .order("created_at", { ascending: true });
  return (data ?? []) as (Omit<
    Pick<
      OrderRow,
      "id" | "status" | "total_amount" | "delivery_address" | "notes" | "created_at"
    >,
    "status"
  > & {
    status: "ASSIGNED" | "IN_TRANSIT";
    merchants: Pick<MerchantRow, "name" | "address" | "phone"> | null;
    order_items: Pick<OrderItemRow, "id" | "quantity" | "snapshot">[];
  })[];
}

export default async function CourierDashboard() {
  const session = await requireRole("courier");
  const courierId = await getCourierId(session.id);

  if (!courierId) {
    return (
      <div className="py-16 text-center text-gray-400">
        Kurye kaydınız bulunamadı.
      </div>
    );
  }

  const orders = await getAssignedOrders(courierId);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        Atanan Teslimatlar
        {orders.length > 0 && (
          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-sm text-orange-700">
            {orders.length}
          </span>
        )}
      </h2>
      <CourierDeliveryQueue initialOrders={orders} courierId={courierId} />
    </div>
  );
}
