/**
 * Admin order history — /admin/orders
 * Full list of all orders, paginated.
 */
import { createAdminServerClient } from "@/lib/supabase/admin";
import type { Database, OrderStatus } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  READY: "Hazır",
  ASSIGNED: "Kurye Atandı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
  REJECTED: "Reddedildi",
  FAILED_DELIVERY: "Teslim Edilemedi",
  CANCELLED: "İptal Edildi",
};

async function getAllOrders() {
  const supabase = createAdminServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, merchant_id, created_at, merchants!left(name)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as (Pick<
    OrderRow,
    "id" | "status" | "total_amount" | "merchant_id" | "created_at"
  > & { merchants: { name: string } | null })[];
}

export default async function AdminOrdersPage() {
  // Layout already enforces requireRole("admin") — no second check needed.
  const orders = await getAllOrders();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Tüm Siparişler ({orders.length})
        </h2>
        <a href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Geri
        </a>
      </div>

      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.merchants?.name ?? "Unknown Merchant"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString("tr-TR")} ·{" "}
                {(order.total_amount / 100).toFixed(2)} ₺
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
