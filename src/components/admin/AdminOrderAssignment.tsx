"use client";

/**
 * Admin courier assignment component.
 * Assigns available courier to READY orders via the transition-order-status Edge Function.
 * Also shows all active orders with status.
 *
 * IMPORTANT: Assignment MUST go through the Edge Function — never direct DB writes.
 * This ensures order_status_log is appended and the state machine is enforced.
 */
import { useState } from "react";
import { getBrowserAccessToken } from "@/lib/supabase/access-token";
import type { OrderStatus } from "@/types/database";

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  merchants: { name: string } | null;
}

interface Courier {
  id: string;
  full_name: string | null;
  is_available: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  READY: "Hazır",
  ASSIGNED: "Kurye Atandı",
  IN_TRANSIT: "Yolda",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  ASSIGNED: "bg-orange-100 text-orange-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
};

async function assignCourierViaEdgeFunction(
  orderId: string,
  courierId: string,
): Promise<void> {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !anonKey) throw new Error("Yapılandırma hatası.");

  const accessToken = await getBrowserAccessToken();

  if (!accessToken) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

  const res = await fetch(`${supabaseUrl}/functions/v1/transition-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      new_status: "ASSIGNED",
      courier_id: courierId,
    }),
  });

  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Kurye atanamadı.");
}

export function AdminOrderAssignment({
  orders: initialOrders,
  couriers,
}: {
  orders: Order[];
  couriers: Courier[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignCourier = async (orderId: string, courierId: string) => {
    setLoadingId(orderId);
    setError(null);

    try {
      await assignCourierViaEdgeFunction(orderId, courierId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "ASSIGNED" as OrderStatus } : o,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kurye atanamadı.");
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
        <p>Aktif sipariş yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {order.merchants?.name ?? "Market"}
              </p>
              <p className="text-xs text-gray-400">
                #{order.id.slice(-8).toUpperCase()} ·{" "}
                {(order.total_amount / 100).toFixed(2)} ₺
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {order.status === "READY" && couriers.length > 0 && (
            <div className="mt-3 flex gap-2">
              <select
                id={`courier-${order.id}`}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Kurye seç...
                </option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? "Kurye"}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById(
                    `courier-${order.id}`,
                  ) as HTMLSelectElement;
                  if (sel.value) void assignCourier(order.id, sel.value);
                }}
                disabled={loadingId === order.id}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loadingId === order.id ? "..." : "Ata"}
              </button>
            </div>
          )}

          {order.status === "READY" && couriers.length === 0 && (
            <p className="mt-2 text-xs text-orange-500">
              Müsait kurye yok
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
