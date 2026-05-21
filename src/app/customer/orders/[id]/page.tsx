/**
 * Customer order tracking — /customer/orders/[id]
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { fetchCustomerOrderById } from "@/lib/orders/fetch-customer-order";
import { log } from "@/lib/logger";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Hazırlanıyor",
  READY: "Hazır — Kurye Bekleniyor",
  ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Alındı",
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
  PICKED_UP: "📦",
  IN_TRANSIT: "🚀",
  DELIVERED: "🎉",
  REJECTED: "❌",
  FAILED_DELIVERY: "⚠️",
  CANCELLED: "🚫",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("customer");

  log.info("customer.order.page", {
    orderId: id,
    userId: session.id,
    redirectTarget: `/customer/orders/${id}`,
  });

  const order = await fetchCustomerOrderById(id, session.id);

  if (!order) {
    log.warn("customer.order.page_not_found", {
      orderId: id,
      userId: session.id,
      rowCount: 0,
    });
    notFound();
  }

  const addr = order.delivery_address as Record<string, string>;
  const sortedLog = [...(order.order_status_log ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const isActive = !["DELIVERED", "REJECTED", "FAILED_DELIVERY", "CANCELLED"].includes(
    order.status,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <a href="/customer/orders" className="text-sm text-blue-600 hover:underline">
          ← Siparişlerim
        </a>
      </div>

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

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 font-semibold text-gray-900">
          {order.merchants?.name ?? "Unknown Merchant"}
        </h3>
        <ul className="space-y-2">
          {(order.order_items ?? [])
            .filter((item) => item?.id && item?.product_name)
            .map((item) => (
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

      {sortedLog.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 font-semibold text-gray-900">Sipariş Geçmişi</h3>
          <ol className="relative space-y-4 border-l border-gray-200 pl-4">
            {sortedLog.map((entry) => (
              <li key={entry.id} className="relative">
                <div className="absolute -left-[1.125rem] top-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                <p className="text-sm font-medium text-gray-900">
                  {STATUS_LABELS[entry.to_status] ?? entry.to_status}
                </p>
                {entry.note && (
                  <p className="text-xs text-gray-400">{entry.note}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleString("tr-TR")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
