/**
 * Admin dashboard — /admin
 * Shows operational overview: pending orders, active couriers, courier assignment.
 */
import { getSession } from "@/lib/auth";
import { createAdminServerClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Database, OrderStatus } from "@/types/database";
import { AdminOrderAssignment } from "@/components/admin/AdminOrderAssignment";
import type { AdminLiveOrder } from "@/hooks/useAdminOrderSubscription";
import { ORDER_MERCHANT_ADMIN } from "@/lib/supabase/relation-selects";
import { log } from "@/lib/logger";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];

async function getAdminData() {
  const supabase = createAdminServerClient();

  const [ordersRes, couriersRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, status, total_amount, merchant_id, courier_id, created_at, ready_at, assignment_escalated_at,
         ${ORDER_MERCHANT_ADMIN}`,
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
      .eq("is_available", true)
      .is("merchant_id", null),
  ]);

  if (ordersRes.error) {
    log.error("admin.dashboard.orders", { error: ordersRes.error.message });
  }
  if (couriersRes.error) {
    log.error("admin.dashboard.couriers", { error: couriersRes.error.message });
  }
  log.info("admin.dashboard.counts", {
    orders: ordersRes.data?.length ?? 0,
    couriers: couriersRes.data?.length ?? 0,
  });

  const orders = (ordersRes.data ?? []) as AdminLiveOrder[];

  const couriers = (couriersRes.data ?? []) as Pick<
    CourierRow,
    "id" | "full_name" | "is_available"
  >[];

  return {
    orders,
    couriers,
    ordersError: ordersRes.error?.message ?? null,
    couriersError: couriersRes.error?.message ?? null,
  };
}

export default async function AdminDashboard() {
  // Layout already enforces requireRole("admin") — no second check needed.
  const session = await getSession();
  if (!session) return null;
  const { orders, couriers, ordersError, couriersError } = await getAdminData();

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

      {(ordersError || couriersError) && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          Veri yüklenirken hata oluştu.
          {ordersError && <span className="block">Siparişler: {ordersError}</span>}
          {couriersError && (
            <span className="block">Kuryeler: {couriersError}</span>
          )}
        </div>
      )}

      <h2 className="mb-3 font-bold text-gray-900">Sipariş İzleme</h2>

      <AdminOrderAssignment orders={orders} platformCouriers={couriers} />

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
