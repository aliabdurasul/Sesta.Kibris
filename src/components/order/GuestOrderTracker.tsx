"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GUEST_TOKEN_HEADER } from "@/lib/guest/token";
import {
  getOrCreateGuestToken,
  getStoredGuestToken,
  rememberGuestOrder,
} from "@/lib/guest/token-client";
import {
  ORDER_STATUS_ICONS,
  ORDER_STATUS_LABELS,
  orderDeliveryEstimate,
} from "@/lib/orders/order-status-labels";
import { SoftSignupCard } from "@/components/order/SoftSignupCard";
import type { GuestOrderDetail } from "@/lib/orders/fetch-guest-order";

interface Props {
  orderId: string;
}

export function GuestOrderTracker({ orderId }: Props) {
  const [order, setOrder] = useState<GuestOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getStoredGuestToken() ?? getOrCreateGuestToken();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/track`, {
        headers: { [GUEST_TOKEN_HEADER]: token },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        order?: GuestOrderDetail;
        error?: string;
      };

      if (!res.ok || !json.order) {
        setOrder(null);
        setError(json.error ?? "Sipariş bulunamadı.");
        return;
      }

      setOrder(json.order);
      rememberGuestOrder(orderId);
    } catch {
      setError("Sipariş yüklenemedi. Bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">Yükleniyor…</div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-gray-600">{error ?? "Sipariş bulunamadı."}</p>
        <p className="mt-2 text-sm text-gray-400">
          Bu cihazda sipariş verdiyseniz tarayıcı verilerini silmemiş olmalısınız.
        </p>
        <Link
          href="/#browse-markets"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Marketlere dön
        </Link>
      </div>
    );
  }

  const addr = order.delivery_address as Record<string, string>;
  const isActive = !["DELIVERED", "REJECTED", "FAILED_DELIVERY", "CANCELLED"].includes(
    order.status,
  );
  const sortedLog = [...(order.order_status_log ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl p-5 shadow-sm ring-1 ${
          isActive ? "bg-blue-50 ring-blue-200" : "bg-white ring-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">
            {ORDER_STATUS_ICONS[order.status] ?? "📦"}
          </span>
          <div>
            <p className="text-sm text-gray-500">Sipariş Durumu</p>
            <p className="text-lg font-bold text-gray-900">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {orderDeliveryEstimate(order.status)}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          #{order.id.slice(-8).toUpperCase()} ·{" "}
          {new Date(order.created_at).toLocaleString("tr-TR")}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 font-semibold text-gray-900">
          {order.merchant?.name ?? "Market"}
        </h3>
        <ul className="space-y-2">
          {(order.order_items ?? []).map((item) => (
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
        <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold">
          <span>Toplam</span>
          <span>{(order.total_amount / 100).toFixed(2)} ₺</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-2 font-semibold text-gray-900">Teslimat</h3>
        <p className="text-sm text-gray-700">{addr?.["full_address"] ?? "—"}</p>
        {order.guest_name && (
          <p className="mt-2 text-xs text-gray-500">{order.guest_name}</p>
        )}
      </div>

      {sortedLog.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 font-semibold text-gray-900">Geçmiş</h3>
          <ol className="space-y-3 border-l border-gray-200 pl-4">
            {sortedLog.slice(0, 5).map((entry) => (
              <li key={entry.id} className="text-sm">
                <p className="font-medium text-gray-900">
                  {ORDER_STATUS_LABELS[entry.to_status] ?? entry.to_status}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleString("tr-TR")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <SoftSignupCard />

      <div className="flex gap-3 text-center text-sm">
        <Link href="/orders/guest" className="flex-1 text-blue-600 hover:underline">
          Diğer siparişlerim
        </Link>
        <Link href="/#browse-markets" className="flex-1 text-gray-500 hover:underline">
          Alışverişe dön
        </Link>
      </div>
    </div>
  );
}
