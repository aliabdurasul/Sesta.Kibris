/**
 * useOrderSubscription — Realtime for merchant order queue.
 * Channel: orders:merchant:{merchantId}
 */
"use client";

import { useCallback, useMemo, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useOrderRealtimeCore, type ConnectionStatus } from "@/hooks/useOrderRealtimeCore";

export type { ConnectionStatus };

const DEFAULT_ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "READY"];

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED_DELIVERY"
  | "CANCELLED";

export interface LiveOrder {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: unknown;
  customer_notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    product_name: string;
    line_total: number;
  }[];
}

interface UseOrderSubscriptionOptions {
  merchantId: string;
  initialOrders: LiveOrder[];
  activeStatuses?: OrderStatus[];
}

export function useOrderSubscription({
  merchantId,
  initialOrders,
  activeStatuses = DEFAULT_ACTIVE_STATUSES,
}: UseOrderSubscriptionOptions) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const activeStatusesRef = useRef(activeStatuses);
  activeStatusesRef.current = activeStatuses;
  const statusesSet = useMemo(
    () => new Set(activeStatuses),
    [activeStatuses.join(",")],
  );

  const fetchOrders = useCallback(async (): Promise<LiveOrder[]> => {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, status, total_amount, delivery_address, customer_notes, created_at, order_items(id, quantity, unit_price, product_name, line_total)",
      )
      .eq("merchant_id", merchantId)
      .in("status", activeStatusesRef.current)
      .order("created_at", { ascending: true });
    return (data ?? []) as LiveOrder[];
  }, [merchantId, supabase]);

  const mergeRow = useCallback(
    (
      prev: LiveOrder[],
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ): LiveOrder[] => {
      const row = payload.new as Record<string, unknown> | undefined;
      const oldRow = payload.old as Record<string, unknown> | undefined;
      const id = (row?.id ?? oldRow?.id) as string | undefined;
      if (!id) return prev;

      if (payload.eventType === "DELETE") {
        return prev.filter((o) => o.id !== id);
      }

      const status = row?.status as OrderStatus | undefined;
      const rowMerchant = row?.merchant_id as string | undefined;
      if (rowMerchant && rowMerchant !== merchantId) {
        return prev.filter((o) => o.id !== id);
      }

      if (!status || !statusesSet.has(status)) {
        return prev.filter((o) => o.id !== id);
      }

      if (payload.eventType === "INSERT") {
        void fetchOrders();
        return prev;
      }

      return prev.map((o) =>
        o.id === id ? { ...o, status } : o,
      );
    },
    [merchantId, statusesSet, fetchOrders],
  );

  const { rows, setRows: setOrders, connectionStatus } = useOrderRealtimeCore({
    filter: { kind: "merchant", merchantId },
    initialRows: initialOrders,
    fetchRows: fetchOrders,
    mergeRow,
  });

  return { orders: rows, setOrders, connectionStatus };
}
