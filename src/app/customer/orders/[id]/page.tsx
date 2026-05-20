/**
 * Customer order tracking page — /customer/orders/[id]
 * Shows order status, items, delivery address, status history.
 * Realtime subscription to be added in Stage 1I.
 */
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, OrderStatus, Json } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatusLogRow = Database["public"]["Tables"]["order_status_log"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Hazırlanıyor",
  READY: "Hazır — Kurye Bekleniyor",
  ASSIGNED: "Kurye Atandı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
  REJECTED: "Reddedildi",
  FAILED_DELIVERY: "Teslim Edilemedi",
  CANCELLED: "İptal Edildi",
};

const STATUS_ICON: Record<string, string> = {
  PENDING: "🕐",
  CONFIRMED: "👨‍🍳",
  READY: "✅",
  ASSIGNED: "🛵",
  IN_TRANSIT: "🚀",
  DELIVERED: "🎉",
  REJECTED: "❌",
  FAILED_DELIVERY: "⚠️",
  CANCELLED: "🚫",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(orderId: string, userId: string) {
  const supabase = await createServerClient();

  const customerRes = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const customerId = (customerRes.data as { id: string } | null)?.id;
  if (!customerId) return null;

  const orderRes = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, delivery_address, customer_notes, created_at,
      merchants(name, phone),
      order_items(id, quantity, unit_price, product_name, line_total),
      order_status_log(id, status, note, created_at, actor_role)
    `)
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();

  return orderRes.data as (Pick<OrderRow, "id" | "status" | "total_amount" | "delivery_address" | "customer_notes" | "created_at"> & {
    merchants: { name: string; phone: string | null } | null;
    order_items: Pick<OrderItemRow, "id" | "quantity" | "unit_price" | "product_name" | "line_total">[];
    order_status_log: Pick<OrderStatusLogRow, "id" | "status" | "note" | "created_at" | "actor_role">[];
  }) | null;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("customer");
  const order = await getOrder(id, session.id);

  if (!order) notFound();

  const addr = order.delivery_address as Record<string, string>;
  const sortedLog = [...order.order_status_log].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const isActive = !["DELIVERED", "REJECTED", "FAILED_DELIVERY", "CANCELLED"].includes(order.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <a href="/customer/orders" className="text-sm text-blue-600 hover:underline">
          ← Siparişlerim
        </a>
      </div>

      {/* Status card */}
      <div
        className={`rounded-2xl p-5 shadow-sm ring-1 ${
          isActive ? "bg-blue-50 ring-blue-200" : "bg-white ring-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{STATUS_ICON[order.status] ?? "📦"}</span>
          <div>
            <p className="text-sm text-gray-500">Sipariş Durumu</p>
            <p className="text-lg font-bold text-gray-900">
              {STATUS_LABELS[order.status] ?? order.status}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          #{order.id.slice(-12).toUpperCase()} ·{" "}
          {new Date(order.created_at).toLocaleString("tr-TR")}
        </p>
      </div>

      {/* Items */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 font-semibold text-gray-900">
          {order.merchants?.name ?? "Market"}
        </h3>
        <ul className="space-y-2">
          {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="text-gray-500">
                  {(item.line_total / 100).toFixed(2)} ₺
                </span>
              </li>
            ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
          <span>Toplam</span>
          <span>{(order.total_amount / 100).toFixed(2)} ₺</span>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-2 font-semibold text-gray-900">Teslimat Adresi</h3>
        <p className="text-sm text-gray-700">{addr?.["full_address"] ?? "—"}</p>
        {addr?.["district"] && (
          <p className="text-xs text-gray-400">{addr["district"]}</p>
        )}
        {order.customer_notes && (
          <p className="mt-2 text-xs text-gray-500 italic">Not: {order.customer_notes}</p>
        )}
      </div>

      {/* Status history */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 font-semibold text-gray-900">Sipariş Geçmişi</h3>
        <ol className="relative border-l border-gray-200 pl-4 space-y-4">
          {sortedLog.map((log) => (
            <li key={log.id} className="relative">
              <div className="absolute -left-[1.125rem] top-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
              <p className="text-sm font-medium text-gray-900">
                {STATUS_LABELS[log.status] ?? log.status}
              </p>
              {log.note && (
                <p className="text-xs text-gray-400">{log.note}</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString("tr-TR")}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
