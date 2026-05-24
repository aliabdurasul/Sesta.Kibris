/**
 * Guest order fetch — service role, token + order id must match.
 * Never expose orders without valid guest_token.
 */
import { timingSafeEqual } from "crypto";
import { createAdminServerClient } from "@/lib/supabase/admin";
import { isValidGuestToken, isValidOrderId } from "@/lib/guest/token";
import { log } from "@/lib/logger";
import { ORDER_MERCHANT_NAME_PHONE } from "@/lib/supabase/relation-selects";
import type { Database } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type GuestOrderDetail = Pick<
  OrderRow,
  | "id"
  | "status"
  | "total_amount"
  | "delivery_address"
  | "customer_notes"
  | "created_at"
  | "guest_name"
  | "guest_phone"
> & {
  merchant: { name: string; phone: string | null } | null;
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

function tokenMatches(stored: string, provided: string): boolean {
  const a = Buffer.from(stored.trim());
  const b = Buffer.from(provided.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function fetchGuestOrderById(
  orderId: string,
  guestToken: string,
): Promise<GuestOrderDetail | null> {
  if (!isValidOrderId(orderId) || !isValidGuestToken(guestToken)) {
    return null;
  }

  const admin = createAdminServerClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id, status, total_amount, delivery_address, customer_notes, created_at,
      guest_name, guest_phone, guest_token, customer_id,
      ${ORDER_MERCHANT_NAME_PHONE},
      order_items(id, quantity, unit_price, product_name, line_total),
      order_status_log(id, to_status, from_status, note, created_at, actor_role)
    `,
    )
    .eq("id", orderId)
    .is("customer_id", null)
    .maybeSingle();

  if (error) {
    log.error("guest.order.fetch_error", {
      orderId,
      reason: error.message,
      code: error.code,
    });
    return null;
  }

  if (!data) return null;

  const row = data as GuestOrderDetail & {
    guest_token: string | null;
    customer_id: string | null;
  };

  if (!row.guest_token || !tokenMatches(row.guest_token, guestToken)) {
    log.warn("guest.order.token_mismatch", { orderId });
    return null;
  }

  const { guest_token: _t, customer_id: _c, ...order } = row;
  return order as GuestOrderDetail;
}

export type GuestOrderSummary = Pick<
  OrderRow,
  "id" | "status" | "total_amount" | "created_at"
> & {
  merchant: { name: string } | null;
};

export async function fetchGuestOrdersByToken(
  guestToken: string,
): Promise<GuestOrderSummary[]> {
  if (!isValidGuestToken(guestToken)) return [];

  const admin = createAdminServerClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id, status, total_amount, created_at, guest_token,
      merchants ( name )
    `,
    )
    .eq("guest_token", guestToken)
    .is("customer_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    log.error("guest.orders.list_error", { reason: error.message });
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      status: OrderRow["status"];
      total_amount: number;
      created_at: string;
      merchants: { name: string } | { name: string }[] | null;
    };
    const m = r.merchants;
    const merchant =
      m && !Array.isArray(m) ? { name: m.name } : Array.isArray(m) && m[0] ? { name: m[0].name } : null;
    return {
      id: r.id,
      status: r.status,
      total_amount: r.total_amount,
      created_at: r.created_at,
      merchant,
    };
  });
}
