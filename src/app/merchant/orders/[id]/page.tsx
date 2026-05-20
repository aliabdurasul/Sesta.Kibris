/**
 * Merchant order detail — /merchant/orders/[id]
 *
 * Shows full order info for a single order belonging to this merchant.
 * Guards:
 *   - requireRole("merchant") — authentication + role
 *   - merchant_id check — tenant isolation (merchant only sees own orders)
 *
 * Safe paths:
 *   - Order not found or wrong merchant → 404 (notFound())
 *   - No merchant row → graceful empty state (no crash)
 */
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Database, OrderStatus } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

interface PageProps {
  params: Promise<{ id: string }>;
}

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  ASSIGNED: "bg-orange-100 text-orange-800",
  IN_TRANSIT: "bg-orange-200 text-orange-900",
  DELIVERED: "bg-green-200 text-green-900",
  REJECTED: "bg-red-100 text-red-700",
  FAILED_DELIVERY: "bg-red-200 text-red-900",
  CANCELLED: "bg-gray-100 text-gray-600",
};

async function getMerchantOrder(userId: string, orderId: string) {
  const supabase = await createServerClient();

  // Resolve merchant_id for this user — enforces tenant isolation
  const { data: merchantData } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const merchant = merchantData as Pick<MerchantRow, "id"> | null;
  if (!merchant) return null;

  // Fetch order — must belong to this merchant (DB + RLS double-guard)
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, delivery_address, customer_notes, rejection_reason, created_at,
       order_items(id, quantity, unit_price, product_name, line_total)`,
    )
    .eq("id", orderId)
    .eq("merchant_id", merchant.id)
    .maybeSingle();

  if (!data) return null;

  return data as Pick<
    OrderRow,
    | "id"
    | "status"
    | "total_amount"
    | "delivery_address"
    | "customer_notes"
    | "rejection_reason"
    | "created_at"
  > & {
    order_items: Pick<
      OrderItemRow,
      "id" | "quantity" | "unit_price" | "product_name" | "line_total"
    >[];
  };
}

export default async function MerchantOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("merchant");
  const order = await getMerchantOrder(session.id, id);

  if (!order) notFound();

  const addr = order.delivery_address as Record<string, string> | null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/merchant" className="text-sm text-blue-600 hover:underline">
          ← Siparişler
        </Link>
        <h2 className="text-lg font-bold text-gray-900">
          Sipariş #{id.slice(-8).toUpperCase()}
        </h2>
      </div>

      {/* Status + meta */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {order.rejection_reason && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200">
            Red sebebi: {order.rejection_reason}
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Ürünler</h3>
        <ul className="space-y-2">
          {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  {(item.line_total / 100).toFixed(2)} ₺
                </span>
              </li>
            ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-bold text-gray-900">Toplam</span>
          <span className="text-sm font-bold text-gray-900">
            {(order.total_amount / 100).toFixed(2)} ₺
          </span>
        </div>
      </div>

      {/* Delivery address */}
      {addr && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Teslimat Adresi
          </h3>
          <p className="text-sm text-gray-900">{addr["full_address"] ?? "—"}</p>
          {addr["district"] && (
            <p className="text-xs text-gray-400">{addr["district"]}</p>
          )}
        </div>
      )}

      {/* Customer notes */}
      {order.customer_notes && (
        <div className="mb-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-xs font-semibold text-amber-700">Müşteri notu</p>
          <p className="mt-1 text-sm text-amber-900">{order.customer_notes}</p>
        </div>
      )}
    </div>
  );
}
