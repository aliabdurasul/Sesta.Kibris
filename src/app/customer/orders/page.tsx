/**
 * Customer order history — /customer/orders
 */
export const dynamic = "force-dynamic";

import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { ORDER_MERCHANT_NAME } from "@/lib/supabase/relation-selects";
import Link from "next/link";
import type { Database, OrderStatus } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

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
  READY: "bg-blue-200 text-blue-900",
  ASSIGNED: "bg-orange-100 text-orange-800",
  IN_TRANSIT: "bg-orange-200 text-orange-900",
  DELIVERED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
  FAILED_DELIVERY: "bg-red-200 text-red-900",
  CANCELLED: "bg-gray-100 text-gray-600",
};

async function getCustomerOrders(userId: string) {
  noStore();
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("orders")
    .select(
      `
      id, status, total_amount, created_at,
      ${ORDER_MERCHANT_NAME}
    `,
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as (Pick<OrderRow, "id" | "status" | "total_amount" | "created_at"> & {
    merchant: { name: string } | null;
  })[];
}

export default async function CustomerOrdersPage() {
  const session = await requireRole("customer");
  const orders = await getCustomerOrders(session.id);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Siparişlerim</h2>

      {orders.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p>Henüz sipariş verilmemiş.</p>
          <Link
            href="/#browse-markets"
            className="mt-4 inline-block text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Marketleri keşfet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {order.merchant?.name ?? "Market"}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {(order.total_amount / 100).toFixed(2)} ₺
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
