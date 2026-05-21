/**
 * useCourierSubscription — Realtime for courier delivery queue.
 * Channel: orders:courier:{courierId}
 */
"use client";

import { useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  useOrderRealtimeCore,
  type ConnectionStatus,
} from "@/hooks/useOrderRealtimeCore";

export type { ConnectionStatus };

const ACTIVE_STATUSES = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] as const;

export type CourierQueueStatus = (typeof ACTIVE_STATUSES)[number];

export interface LiveDelivery {
  id: string;
  status: CourierQueueStatus;
  total_amount: number;
  delivery_address: unknown;
  customer_notes: string | null;
  created_at: string;
  merchants: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  order_items: {
    id: string;
    quantity: number;
    product_name: string;
    line_total: number;
  }[];
}

const SELECT =
  "id, status, total_amount, delivery_address, customer_notes, created_at, merchants!orders_merchant_id_fkey(name, address, phone), order_items(id, quantity, product_name, line_total)";

interface UseCourierSubscriptionOptions {
  courierId: string;
  initialOrders: LiveDelivery[];
}

export function useCourierSubscription({
  courierId,
  initialOrders,
}: UseCourierSubscriptionOptions) {
  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchOrders = useCallback(async (): Promise<LiveDelivery[]> => {
    const { data } = await supabase
      .from("orders")
      .select(SELECT)
      .eq("courier_id", courierId)
      .in("status", [...ACTIVE_STATUSES])
      .order("assigned_at", { ascending: true, nullsFirst: false });
    return (data ?? []) as LiveDelivery[];
  }, [courierId, supabase]);

  const mergeRow = useCallback(
    (
      prev: LiveDelivery[],
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ): LiveDelivery[] => {
      const row = payload.new as Record<string, unknown> | undefined;
      const oldRow = payload.old as Record<string, unknown> | undefined;
      const id = (row?.id ?? oldRow?.id) as string | undefined;
      if (!id) return prev;

      if (payload.eventType === "DELETE") {
        return prev.filter((o) => o.id !== id);
      }

      const status = row?.status as string | undefined;
      const courier = row?.courier_id as string | undefined;

      if (courier !== courierId) {
        return prev.filter((o) => o.id !== id);
      }

      if (
        !status ||
        !ACTIVE_STATUSES.includes(status as CourierQueueStatus)
      ) {
        return prev.filter((o) => o.id !== id);
      }

      if (
        payload.eventType === "INSERT" ||
        (payload.eventType === "UPDATE" && !prev.some((o) => o.id === id))
      ) {
        void fetchOrders();
        return prev;
      }

      return prev.map((o) =>
        o.id === id ? { ...o, status: status as CourierQueueStatus } : o,
      );
    },
    [courierId, fetchOrders],
  );

  const { rows, setRows, connectionStatus, refetch } = useOrderRealtimeCore({
    filter: { kind: "courier", courierId },
    initialRows: initialOrders,
    fetchRows: fetchOrders,
    mergeRow,
  });

  return { orders: rows, setOrders: setRows, connectionStatus, refetch };
}
