/**
 * Server-only customer order fetch — no cache, RLS-aligned.
 */
import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type CustomerOrderDetail = Pick<
  OrderRow,
  "id" | "status" | "total_amount" | "delivery_address" | "customer_notes" | "created_at"
> & {
  merchants: { name: string; phone: string | null } | null;
  order_items: Pick<
    OrderItemRow,
    "id" | "quantity" | "unit_price" | "product_name" | "line_total"
  >[];
  order_status_log: {
    id: string;
    to_status: string;
    from_status: string | null;
    note: string | null;
    created_at: string;
    actor_role: string;
  }[];
};

/**
 * RLS: orders_select_customer uses customer_id = auth.uid().
 * customers.id equals auth user id — filter by userId directly.
 */
export async function fetchCustomerOrderById(
  orderId: string,
  userId: string,
): Promise<CustomerOrderDetail | null> {
  noStore();

  const supabase = await createServerClient();

  const orderRes = await supabase
    .from("orders")
    .select(
      `
      id, status, total_amount, delivery_address, customer_notes, created_at,
      merchants!left(name, phone),
      order_items(id, quantity, unit_price, product_name, line_total),
      order_status_log(id, to_status, from_status, note, created_at, actor_role)
    `,
    )
    .eq("id", orderId)
    .eq("customer_id", userId)
    .maybeSingle();

  if (orderRes.error) {
    log.error("customer.order.fetch_error", {
      orderId,
      userId,
      reason: orderRes.error.message,
      code: orderRes.error.code,
    });
    return null;
  }

  const rowCount = orderRes.data ? 1 : 0;
  log.info("customer.order.fetch", {
    orderId,
    userId,
    rowCount,
    found: !!orderRes.data,
  });

  return (orderRes.data as CustomerOrderDetail | null) ?? null;
}
