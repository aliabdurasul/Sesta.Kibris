/**
 * useAdminOrderSubscription — Realtime for admin monitoring board.
 * Channel: orders:admin
 */
"use client";

import { useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useOrderRealtimeCore, type ConnectionStatus } from "@/hooks/useOrderRealtimeCore";
import type { DeliveryMode } from "@/types/database";

export type { ConnectionStatus };

export interface AdminLiveOrder {
  id: string;
  status: string;
  total_amount: number;
  merchant_id: string;
  courier_id: string | null;
  created_at: string;
  ready_at: string | null;
  assignment_escalated_at?: string | null;
  merchants: {
    name: string;
    delivery_mode: DeliveryMode;
    hybrid_assign_timeout_minutes: number;
  } | null;
}

interface Options {
  initialOrders: AdminLiveOrder[];
  activeStatuses?: string[];
}

const DEFAULT_STATUSES = ["READY", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
const ACTIVE = new Set([
  "PENDING",
  "CONFIRMED",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
]);

export function useAdminOrderSubscription({
  initialOrders,
  activeStatuses = [
    "PENDING",
    "CONFIRMED",
    "READY",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
  ],
}: Options) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const statusesRef = useMemo(() => activeStatuses, [activeStatuses.join(",")]);

  const fetchOrders = useCallback(async (): Promise<AdminLiveOrder[]> => {
    const { data } = await supabase
      .from("orders")
      .select(
        `id, status, total_amount, merchant_id, courier_id, created_at, ready_at, assignment_escalated_at,
         merchants!left(name, delivery_mode, hybrid_assign_timeout_minutes)`,
      )
      .in("status", statusesRef)
      .order("created_at", { ascending: false });
    return (data ?? []) as AdminLiveOrder[];
  }, [supabase, statusesRef]);

  const mergeRow = useCallback(
    (
      prev: AdminLiveOrder[],
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ): AdminLiveOrder[] => {
      const row = payload.new as Record<string, unknown> | undefined;
      const oldRow = payload.old as Record<string, unknown> | undefined;
      const id = (row?.id ?? oldRow?.id) as string | undefined;
      if (!id) return prev;

      if (payload.eventType === "DELETE") {
        return prev.filter((o) => o.id !== id);
      }

      const status = row?.status as string | undefined;
      if (!status || !ACTIVE.has(status)) {
        return prev.filter((o) => o.id !== id);
      }

      if (payload.eventType === "INSERT") {
        void fetchOrders();
        return prev;
      }

      return prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              courier_id: (row?.courier_id as string | null) ?? o.courier_id,
              ready_at: (row?.ready_at as string | null) ?? o.ready_at,
              assignment_escalated_at:
                (row?.assignment_escalated_at as string | null) ??
                o.assignment_escalated_at,
            }
          : o,
      );
    },
    [fetchOrders],
  );

  const { rows, setRows, connectionStatus, refetch } = useOrderRealtimeCore({
    filter: { kind: "admin" },
    initialRows: initialOrders,
    fetchRows: fetchOrders,
    mergeRow,
  });

  return { orders: rows, setOrders: setRows, connectionStatus, refetch };
}
