"use client";

/**
 * Merchant order queue — shows PENDING/CONFIRMED/READY orders.
 * Accept/Reject buttons call transition-order-status Edge Function.
 * Realtime subscription provides live order updates.
 */
import { useState } from "react";
import Link from "next/link";
import { useOrderSubscription } from "@/hooks/useOrderSubscription";
import type { Json, OrderStatus } from "@/types/database";

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

interface Props {
  initialOrders: Order[];
  merchantId: string;
}

type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const config = {
    connecting:  { color: "bg-yellow-400", label: "Bağlanıyor..." },
    connected:   { color: "bg-green-500",  label: "Canlı" },
    reconnecting:{ color: "bg-yellow-500", label: "Yeniden bağlanıyor..." },
    error:       { color: "bg-red-500",    label: "Bağlantı kesildi" },
  }[status];

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  READY: "Hazır",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
};

async function transitionOrder(
  orderId: string,
  newStatus: string,
  note?: string,
) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  // Must use the user's session access_token, not the anon key.
  // The anon key is a public API key — it is NOT a user JWT and will 401.
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
  if (!res.ok) throw new Error(data.error ?? "Geçiş başarısız.");
}

export function MerchantOrderQueue({ initialOrders, merchantId }: Props) {
  const { orders, setOrders, connectionStatus } = useOrderSubscription({
    merchantId,
    initialOrders,
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    note?: string,
  ) => {
    setLoadingId(orderId);
    setError(null);
    try {
      await transitionOrder(orderId, newStatus, note);
      setOrders((prev) =>
        prev.filter((o) =>
          // Remove from queue if terminal or READY (READY stays until courier takes)
          !(o.id === orderId && (newStatus === "REJECTED" || newStatus === "CONFIRMED" && false)),
        ).map((o) =>
          o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o,
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
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg">Bekleyen sipariş yok.</p>
          <p className="mt-1 text-sm">Yeni siparişler burada görünecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        const items = order.order_items;

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
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {/* Items */}
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

            {order.customer_notes && (
              <p className="mt-1 text-xs text-gray-500 italic">
                Not: {order.customer_notes}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {order.status === "PENDING" && (
                <>
                  <button
                    onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✓ Onayla"}
                  </button>
                  <button
                    onClick={() =>
                      updateOrderStatus(order.id, "REJECTED", "Market reddetti")
                    }
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✗ Reddet"}
                  </button>
                </>
              )}

              {order.status === "CONFIRMED" && (
                <button
                  onClick={() => updateOrderStatus(order.id, "READY")}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Hazırlanıyor..." : "Hazır İşaretle"}
                </button>
              )}

              {order.status === "READY" && (
                <div className="w-full rounded-xl bg-gray-50 py-2.5 text-center text-sm text-gray-400 ring-1 ring-gray-200">
                  Kurye bekleniyor...
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
