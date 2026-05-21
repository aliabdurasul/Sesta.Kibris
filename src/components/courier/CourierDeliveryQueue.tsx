"use client";

/**
 * Courier delivery queue with realtime updates.
 * Flow: ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED | FAILED_DELIVERY
 */
import { useState } from "react";
import { useCourierSubscription } from "@/hooks/useCourierSubscription";
import type { CourierQueueStatus } from "@/hooks/useCourierSubscription";
import type { Json } from "@/types/database";

interface OrderMerchant {
  name: string;
  address: string | null;
  phone: string | null;
}

interface OrderItemData {
  id: string;
  quantity: number;
  product_name: string;
  line_total: number;
}

interface Order {
  id: string;
  status: CourierQueueStatus;
  total_amount: number;
  delivery_address: Json;
  customer_notes: string | null;
  created_at: string;
  merchant: OrderMerchant | null;
  order_items: OrderItemData[];
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Alınacak",
  PICKED_UP: "Alındı",
  IN_TRANSIT: "Yolda",
};

async function doTransition(orderId: string, newStatus: string, note?: string) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  const { getBrowserAccessToken } = await import("@/lib/supabase/access-token");
  const accessToken = await getBrowserAccessToken();

  if (!accessToken) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

  const res = await fetch(`${supabaseUrl}/functions/v1/transition-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey!,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ order_id: orderId, new_status: newStatus, note }),
  });

  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
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

export function CourierDeliveryQueue({
  initialOrders,
  courierId,
}: {
  initialOrders: Order[];
  courierId: string;
}) {
  const { orders, setOrders, connectionStatus } = useCourierSubscription({
    courierId,
    initialOrders,
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransition = async (
    orderId: string,
    newStatus: string,
    note?: string,
  ) => {
    setLoadingId(orderId);
    setError(null);
    try {
      await doTransition(orderId, newStatus, note);

      const isTerminal =
        newStatus === "DELIVERED" || newStatus === "FAILED_DELIVERY";
      setOrders((prev) =>
        isTerminal
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) =>
              o.id === orderId
                ? { ...o, status: newStatus as CourierQueueStatus }
                : o,
            ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-3">
        <ConnectionDot status={connectionStatus} />
        {connectionStatus === "error" && (
          <p className="text-sm text-red-600" role="alert">
            Canlı güncellemeler kesildi. Sayfayı yenileyin veya bağlantınızı kontrol edin.
          </p>
        )}
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg">Atanan teslimat yok.</p>
          <p className="mt-1 text-sm">Hazır siparişler size atandığında burada görünecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConnectionDot status={connectionStatus} />
      {connectionStatus === "error" && (
        <p className="text-sm text-red-600" role="alert">
          Canlı güncellemeler kesildi. Liste otomatik yenilenmeyebilir.
        </p>
      )}
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
        const merchant = order.merchant;

        return (
          <div
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                #{order.id.slice(-8).toUpperCase()}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "IN_TRANSIT"
                    ? "bg-orange-100 text-orange-700"
                    : order.status === "PICKED_UP"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {merchant && (
              <div className="mb-3 rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Alınacak Yer
                </p>
                <p className="mt-1 font-medium text-gray-900">{merchant.name}</p>
                {merchant.address && (
                  <p className="text-sm text-gray-500">{merchant.address}</p>
                )}
                {merchant.phone && (
                  <a
                    href={`tel:${merchant.phone}`}
                    className="mt-1 block text-sm text-blue-600"
                  >
                    {merchant.phone}
                  </a>
                )}
              </div>
            )}

            <div className="mb-3 rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Teslimat Adresi
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {addr?.["full_address"] ?? "—"}
              </p>
              {addr?.["district"] && (
                <p className="text-xs text-gray-400">{addr["district"]}</p>
              )}
            </div>

            {order.customer_notes && (
              <p className="mb-3 text-xs italic text-gray-400">
                Not: {order.customer_notes}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-2">
              {order.status === "ASSIGNED" && (
                <button
                  onClick={() =>
                    handleTransition(order.id, "PICKED_UP", "Kurye işletmeden aldı")
                  }
                  disabled={isLoading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "..." : "📦 İşletmeden Aldım"}
                </button>
              )}

              {order.status === "PICKED_UP" && (
                <button
                  onClick={() =>
                    handleTransition(order.id, "IN_TRANSIT", "Kurye yola çıktı")
                  }
                  disabled={isLoading}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                >
                  {isLoading ? "..." : "🚗 Yola Çıkıyorum"}
                </button>
              )}

              {order.status === "IN_TRANSIT" && (
                <>
                  <button
                    onClick={() =>
                      handleTransition(order.id, "DELIVERED", "Kurye teslim etti")
                    }
                    disabled={isLoading}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✓ Teslim Edildi"}
                  </button>
                  <button
                    onClick={() =>
                      handleTransition(
                        order.id,
                        "FAILED_DELIVERY",
                        "Teslimat başarısız",
                      )
                    }
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✗ Teslim Edilemedi"}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
