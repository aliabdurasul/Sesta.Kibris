/**
 * Guest order fetch — service role; token must match orders.guest_token.
 */
import { createAdminServerClient } from "@/lib/supabase/admin";
import {
  guestTokensMatch,
  isValidGuestToken,
  isValidOrderId,
  normalizeGuestToken,
} from "@/lib/guest/token";
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

export type GuestOrderFetchResult =
  | { status: "ok"; order: GuestOrderDetail }
  | { status: "not_found" }
  | { status: "token_mismatch" }
  | { status: "auth_required" };

/** Ensures orders.guest_token is set (edge may omit it on stale deploy). */
export async function persistGuestOrderToken(
  orderId: string,
  guestToken: string,
): Promise<boolean> {
  if (!isValidOrderId(orderId) || !isValidGuestToken(guestToken)) {
    return false;
  }

  const admin = createAdminServerClient();
  const normalized = normalizeGuestToken(guestToken);
  const { error } = await admin
    .from("orders")
    .update({ guest_token: normalized } as never)
    .eq("id", orderId)
    .is("customer_id", null);

  if (error) {
    log.error("guest.order.token_persist_failed", {
      orderId,
      reason: error.message,
      code: error.code,
    });
    return false;
  }

  return true;
}

export async function fetchOrderForTracking(
  orderId: string,
  guestToken: string | null,
  authenticatedUserId: string | null,
  guestUserIdFromCookie: string | null = null,
): Promise<GuestOrderFetchResult> {
  if (!isValidOrderId(orderId)) {
    return { status: "not_found" };
  }

  const admin = createAdminServerClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id, status, total_amount, delivery_address, customer_notes, created_at,
      guest_name, guest_phone, guest_token, guest_user_id, customer_id,
      ${ORDER_MERCHANT_NAME_PHONE},
      order_items(id, quantity, unit_price, product_name, line_total),
      order_status_log(id, to_status, from_status, note, created_at, actor_role)
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    log.error("guest.order.fetch_error", {
      orderId,
      reason: error.message,
      code: error.code,
    });
    return { status: "not_found" };
  }

  if (!data) return { status: "not_found" };

  const row = data as GuestOrderDetail & {
    guest_token: string | null;
    guest_user_id: string | null;
    customer_id: string | null;
  };

  if (row.customer_id) {
    if (!authenticatedUserId || row.customer_id !== authenticatedUserId) {
      return { status: "auth_required" };
    }
    const { guest_token: _t, customer_id: _c, ...order } = row;
    return { status: "ok", order: order as GuestOrderDetail };
  }

  if (!guestToken || !isValidGuestToken(guestToken)) {
    return { status: "token_mismatch" };
  }

  const stored = row.guest_token?.trim() ?? "";
  if (!stored) {
    const cookieMatchesOrder =
      guestUserIdFromCookie &&
      row.guest_user_id &&
      guestUserIdFromCookie === row.guest_user_id;

    if (cookieMatchesOrder) {
      const backfilled = await persistGuestOrderToken(orderId, guestToken);
      if (backfilled) {
        log.info("guest.order.token_backfilled", { orderId });
      }
      const { guest_token: _t, guest_user_id: _g, customer_id: _c, ...order } = row;
      return { status: "ok", order: order as GuestOrderDetail };
    }

    log.warn("guest.order.missing_db_token", { orderId });
    return { status: "token_mismatch" };
  }

  if (!guestTokensMatch(stored, guestToken)) {
    log.warn("guest.order.token_mismatch", {
      orderId,
      storedPrefix: normalizeGuestToken(stored).slice(0, 8),
    });
    return { status: "token_mismatch" };
  }

  const { guest_token: _t, customer_id: _c, ...order } = row;
  return { status: "ok", order: order as GuestOrderDetail };
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

  const normalized = normalizeGuestToken(guestToken);
  const admin = createAdminServerClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id, status, total_amount, created_at, guest_token,
      merchants ( name )
    `,
    )
    .is("customer_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    log.error("guest.orders.list_error", { reason: error.message });
    return [];
  }

  return (data ?? [])
    .filter((row) => {
      const r = row as { guest_token: string | null };
      return r.guest_token && guestTokensMatch(r.guest_token, normalized);
    })
    .map((row) => {
      const r = row as {
        id: string;
        status: OrderRow["status"];
        total_amount: number;
        created_at: string;
        merchants: { name: string } | { name: string }[] | null;
      };
      const m = r.merchants;
      const merchant =
        m && !Array.isArray(m)
          ? { name: m.name }
          : Array.isArray(m) && m[0]
            ? { name: m[0].name }
            : null;
      return {
        id: r.id,
        status: r.status,
        total_amount: r.total_amount,
        created_at: r.created_at,
        merchant,
      };
    });
}

/** @deprecated use fetchOrderForTracking */
export async function fetchGuestOrderById(
  orderId: string,
  guestToken: string,
): Promise<GuestOrderDetail | null> {
  const result = await fetchOrderForTracking(orderId, guestToken, null);
  return result.status === "ok" ? result.order : null;
}
