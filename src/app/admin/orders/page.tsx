/**
 * Admin order history — /admin/orders
 */
import { createAdminServerClient } from "@/lib/supabase/admin";
import { AdminOrdersList, type AdminOrderRow } from "@/components/admin/AdminOrdersList";
import { PageHeader } from "@/components/adaptive/PageHeader";
import { ORDER_MERCHANT_NAME } from "@/lib/supabase/relation-selects";
import { log } from "@/lib/logger";
import Link from "next/link";

async function getAllOrders(): Promise<AdminOrderRow[]> {
  const supabase = createAdminServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, merchant_id, created_at, ${ORDER_MERCHANT_NAME}`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    log.error("admin.orders.list", { error: error.message });
  } else {
    log.info("admin.orders.list", { count: data?.length ?? 0 });
  }

  return (data ?? []) as AdminOrderRow[];
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <PageHeader
        title={`Tüm Siparişler (${orders.length})`}
        actions={
          <Link href="/admin" className="text-sm text-accent-strong hover:underline">
            ← Panel
          </Link>
        }
      />
      <AdminOrdersList orders={orders} />
    </div>
  );
}
