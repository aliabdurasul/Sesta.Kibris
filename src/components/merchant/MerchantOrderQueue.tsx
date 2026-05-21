"use client";

/**
 * Merchant order queue — PENDING / CONFIRMED / READY.
 * READY: assign courier per delivery_mode (merchant-owned or HYBRID).
 */
import { useState } from "react";
import Link from "next/link";
import { useOrderSubscription } from "@/hooks/useOrderSubscription";
import {
  deliveryModeLabel,
  merchantCanAssign,
} from "@/lib/delivery/assignment";
import type { DeliveryMode, Json, OrderStatus } from "@/types/database";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  line_total: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: Json;
  customer_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface MerchantCourier {
  id: string;
  full_name: string | null;
  is_available: boolean;
}

interface Props {
  initialOrders: Order[];
  merchantId: string;
  deliveryMode: DeliveryMode;
  merchantCouriers: MerchantCourier[];
  defaultCourierId: string | null;
}

type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const config = {
    connecting: { color: "bg-yellow-400", label: "Bağlanıyor..." },
    connected: { color: "bg-green-500", label: "Canlı" },
    reconnecting: { color: "bg-yellow-500", label: "Yeniden bağlanıyor..." },
    error: { color: "bg-red-500", label: "Bağlantı kesildi" },
  }[status];

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}

async function transitionOrder(
  orderId: string,
  newStatus: string,
  options?: { courierId?: string; note?: string },
) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  const { getBrowserAccessToken } = await import("@/lib/supabase/access-token");
  const accessToken = await getBrowserAccessToken();

  if (!accessToken) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

  const body: Record<string, string> = {
    order_id: orderId,
    new_status: newStatus,
  };
  if (options?.courierId) body["courier_id"] = options.courierId;
  if (options?.note) body["note"] = options.note;

  const res = await fetch(`${supabaseUrl}/functions/v1/transition-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey!,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Geçiş başarısız.");
}

export function MerchantOrderQueue({
  initialOrders,
  merchantId,
  deliveryMode,
  merchantCouriers,
  defaultCourierId,
}: Props) {
  const { orders, setOrders, connectionStatus } = useOrderSubscription({
    merchantId,
    initialOrders,
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showAssign = merchantCanAssign(deliveryMode);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    options?: { courierId?: string; note?: string },
  ) => {
    setLoadingId(orderId);
    setError(null);
    try {
      await transitionOrder(orderId, newStatus, options);
      setOrders((prev) => {
        if (newStatus === "ASSIGNED" || newStatus === "REJECTED") {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o,
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  const assignCourier = async (orderId: string, courierId?: string) => {
    await updateOrderStatus(orderId, "ASSIGNED", {
      courierId,
      note: courierId
        ? "İşletme kurye atadı"
        : "İşletme varsayılan kurye ile gönderdi",
    });
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-3">
        <ConnectionDot status={connectionStatus} />
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg">Bekleyen sipariş yok.</p>
          <p className="mt-1 text-sm">Yeni siparişler burada görünecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Teslimat: {deliveryModeLabel(deliveryMode)}
      </p>
      <ConnectionDot status={connectionStatus} />
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}

      {orders.map((order) => {
        const isLoading = loadingId === order.id;
        const addr = order.delivery_address as Record<string, string>;
        const items = (order.order_items ?? []).filter(
          (item) => item?.id && item?.product_name,
        );

        return (
          <div
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/merchant/orders/${order.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  #{order.id.slice(-8).toUpperCase()}
                </Link>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "READY"
                    ? "bg-green-100 text-green-800"
                    : order.status === "CONFIRMED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.status === "PENDING" ? "Oluşturuldu" : order.status}
              </span>
            </div>

            <ul className="mb-3 space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between text-sm text-gray-700"
                >
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="text-gray-500">
                    {(item.line_total / 100).toFixed(2)} ₺
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-900">
              <span>Toplam</span>
              <span>{(order.total_amount / 100).toFixed(2)} ₺</span>
            </div>

            {addr?.["full_address"] && (
              <p className="mt-2 text-xs text-gray-400">
                📍 {addr["full_address"]}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {order.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() =>
                      updateOrderStatus(order.id, "REJECTED", {
                        note: "Market reddetti",
                      })
                    }
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </div>
              )}

              {order.status === "CONFIRMED" && (
                <button
                  onClick={() => updateOrderStatus(order.id, "READY")}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Hazır İşaretle
                </button>
              )}

              {order.status === "READY" && showAssign && (
                <div className="space-y-2">
                  {merchantCouriers.length > 0 ? (
                    <>
                      <select
                        id={`mcourier-${order.id}`}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        defaultValue={defaultCourierId ?? ""}
                      >
                        <option value="" disabled>
                          Kurye seç...
                        </option>
                        {merchantCouriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name ?? "Kurye"}
                            {!c.is_available ? " (meşgul)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const sel = document.getElementById(
                            `mcourier-${order.id}`,
                          ) as HTMLSelectElement;
                          void assignCourier(order.id, sel.value || undefined);
                        }}
                        disabled={isLoading}
                        className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Kurye Ata / Gönder
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-orange-600">
                      Aktif işletme kuryesi yok — sipariş READY kalır.
                    </p>
                  )}
                  {defaultCourierId && (
                    <button
                      type="button"
                      onClick={() => void assignCourier(order.id, defaultCourierId)}
                      disabled={isLoading}
                      className="w-full rounded-xl bg-gray-100 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 disabled:opacity-50"
                    >
                      Varsayılan kurye ile gönder
                    </button>
                  )}
                </div>
              )}

              {order.status === "READY" && !showAssign && (
                <p className="text-center text-sm text-gray-500">
                  Platform kuryesi yönetici tarafından atanacak.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
