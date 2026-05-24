"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getGuestTokenForOrder,
  rememberGuestOrder,
  saveGuestToken,
} from "@/lib/guest/token-client";
import { isValidGuestToken } from "@/lib/guest/token";
import {
  ORDER_STATUS_LABELS,
  orderDeliveryEstimate,
} from "@/lib/orders/order-status-labels";
import { SplitPanel } from "@/components/adaptive/SplitPanel";
import { OrderStatusTimeline } from "@/components/customer/OrderStatusTimeline";
import { Card } from "@/components/ui/Card";
import { SoftSignupCard } from "@/components/order/SoftSignupCard";
import { StatusChip } from "@/components/ui/StatusChip";
import type { GuestOrderDetail } from "@/lib/orders/fetch-guest-order";

interface Props {
  orderId: string;
}

export function GuestOrderTracker({ orderId }: Props) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<GuestOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const fromUrl = searchParams.get("token")?.trim() ?? null;
    if (fromUrl && isValidGuestToken(fromUrl)) {
      saveGuestToken(fromUrl, orderId);
    }

    const token = getGuestTokenForOrder(orderId);
    if (!token) {
      setLoading(false);
      setError(
        "Sipariş takip anahtarı bulunamadı. Aynı cihaz ve tarayıcıdan açın veya yeni sipariş verin.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/orders/${orderId}/track?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as {
        order?: GuestOrderDetail;
        error?: string;
        code?: string;
      };

      if (res.status === 403) {
        setOrder(null);
        setError(
          json.code === "AUTH_REQUIRED"
            ? "Bu sipariş için giriş yapmanız gerekiyor."
            : "Erişim reddedildi. Takip bağlantısını aynı cihazdan açın.",
        );
        return;
      }

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
  }, [orderId, searchParams]);

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

  const mainContent = (
    <div className="space-y-4">
      <div
        className={`rounded-2xl p-5 shadow-sm ring-1 ${
          isActive ? "bg-accent-soft ring-accent/30" : "bg-brand-white ring-border"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-muted">Sipariş Durumu</p>
          <StatusChip status={order.status} />
        </div>
        <OrderStatusTimeline status={order.status} />
        <p className="mt-4 text-sm text-text-secondary">
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
        <Link href="/orders/guest" className="flex-1 text-accent-strong hover:underline">
          Diğer siparişlerim
        </Link>
        <Link href="/#browse-markets" className="flex-1 text-text-muted hover:underline">
          Alışverişe dön
        </Link>
      </div>
    </div>
  );

  const desktopAside = (
    <Card className="hidden lg:block">
      <h3 className="mb-2 font-semibold text-brand-navy">Teslimat takibi</h3>
      <p className="text-sm text-text-muted">
        Canlı harita ve kurye konumu yakında bu panelde görünecek.
      </p>
      <div className="mt-4 flex h-40 items-center justify-center rounded-xl bg-app-bg text-3xl ring-1 ring-border">
        🗺️
      </div>
    </Card>
  );

  return (
    <SplitPanel list={mainContent} detail={desktopAside} />
  );
}
