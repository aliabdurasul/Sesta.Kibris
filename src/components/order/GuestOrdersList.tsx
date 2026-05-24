"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GUEST_TOKEN_HEADER } from "@/lib/guest/token";
import { getOrCreateGuestToken } from "@/lib/guest/token-client";
import { ORDER_STATUS_LABELS } from "@/lib/orders/order-status-labels";
import { SoftSignupCard } from "@/components/order/SoftSignupCard";

type GuestOrderSummary = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  merchant: { name: string } | null;
};

export function GuestOrdersList() {
  const [orders, setOrders] = useState<GuestOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getOrCreateGuestToken();
    fetch("/api/orders/guest", {
      headers: { [GUEST_TOKEN_HEADER]: token },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json: { orders?: GuestOrderSummary[] }) => {
        setOrders(json.orders ?? []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400">Yükleniyor…</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-gray-600">Henüz sipariş bulunamadı.</p>
          <Link
            href="/#browse-markets"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Marketlere göz atın
          </Link>
        </div>
        <SoftSignupCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/order/${order.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.merchant?.name ?? "Market"}
                  </p>
                  <p className="text-xs text-gray-400">
                    #{order.id.slice(-8).toUpperCase()} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {(order.total_amount / 100).toFixed(2)} ₺
                  </p>
                  <p className="text-xs text-blue-600">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <SoftSignupCard />
    </div>
  );
}
