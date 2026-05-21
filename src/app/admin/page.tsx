/**
 * Admin dashboard — /admin
 * Shows operational overview: pending orders, active couriers, courier assignment.
 */
import { getSession } from "@/lib/auth";
import { createAdminServerClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Database, OrderStatus } from "@/types/database";
import { AdminOrderAssignment } from "@/components/admin/AdminOrderAssignment";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];

async function getAdminData() {
  const supabase = createAdminServerClient();

  const [ordersRes, couriersRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, status, total_amount, merchant_id, courier_id, created_at, merchants!left(name)`,
      )
      .in("status", [
        "PENDING",
        "CONFIRMED",
        "READY",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
      ])
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("couriers")
      .select("id, full_name, is_available")
      .eq("is_active", true)
      .eq("is_available", true),
  ]);

  const orders = (ordersRes.data ?? []) as (Pick<
    OrderRow,
    "id" | "status" | "total_amount" | "merchant_id" | "courier_id" | "created_at"
  > & { merchants: { name: string } | null })[];

  const couriers = (couriersRes.data ?? []) as Pick<
    CourierRow,
    "id" | "full_name" | "is_available"
  >[];

  return { orders, couriers };
}

export default async function AdminDashboard() {
  // Layout already enforces requireRole("admin") — no second check needed.
  const session = await getSession();
  if (!session) return null;
  const { orders, couriers } = await getAdminData();

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const ready = orders.filter((o) => o.status === "READY").length;
  const active = orders.filter((o) =>
    ["CONFIRMED", "ASSIGNED", "IN_TRANSIT"].includes(o.status),
  ).length;

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-200">
          <p className="text-2xl font-bold text-yellow-800">{pending}</p>
          <p className="text-xs text-yellow-600">Bekleyen</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
          <p className="text-2xl font-bold text-green-800">{ready}</p>
          <p className="text-xs text-green-600">Hazır</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
          <p className="text-2xl font-bold text-blue-800">{couriers.length}</p>
          <p className="text-xs text-blue-600">Müsait Kurye</p>
        </div>
      </div>

      <h2 className="mb-3 font-bold text-gray-900">Tüm Aktif Siparişler</h2>

      <AdminOrderAssignment orders={orders} couriers={couriers} />

      <div className="mt-4">
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          Tüm sipariş geçmişi →
        </Link>
      </div>
    </div>
  );
}
