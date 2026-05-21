/**
 * useAdminOrderSubscription — Admin order board state.
 *
 * Default: SSR baseline only (enableRealtime=false) — no client refetch on mount.
 * Optional enableRealtime: patch-only updates via preserveSsrBaseline.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useOrderRealtimeCore, type ConnectionStatus } from "@/hooks/useOrderRealtimeCore";
import { ORDER_MERCHANT_ADMIN } from "@/lib/supabase/relation-selects";
import { fetchSupabaseList } from "@/lib/supabase/safe-query";
import type { DeliveryMode } from "@/types/database";

export type { ConnectionStatus };

const IS_DEV = process.env.NODE_ENV === "development";

export interface AdminLiveOrder {
  id: string;
  status: string;
  total_amount: number;
  merchant_id: string;
  courier_id: string | null;
  created_at: string;
  ready_at: string | null;
  assignment_escalated_at?: string | null;
  merchant: {
    name: string;
    delivery_mode: DeliveryMode;
    hybrid_assign_timeout_minutes: number;
  } | null;
}

interface Options {
  initialOrders: AdminLiveOrder[];
  activeStatuses?: string[];
  /** Off by default — SSR data stays until row-level realtime patches. */
  enableRealtime?: boolean;
}

const ACTIVE = new Set([
  "PENDING",
  "CONFIRMED",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
]);

function mergeAdminOrderRow(
  prev: AdminLiveOrder[],
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): AdminLiveOrder[] {
  const row = payload.new as Record<string, unknown> | undefined;
  const oldRow = payload.old as Record<string, unknown> | undefined;
  const id = (row?.id ?? oldRow?.id) as string | undefined;
  if (!id) return prev;

  if (payload.eventType === "DELETE") {
    return prev.filter((o) => o.id !== id);
  }

  if (!row) return prev;

  const status = row.status as string | undefined;
  if (!status || !ACTIVE.has(status)) {
    return prev.filter((o) => o.id !== id);
  }

  const exists = prev.find((o) => o.id === id);
  if (!exists) {
    if (IS_DEV) {
      console.log("[ADMIN REALTIME] unknown row — keeping SSR list", id);
    }
    return prev;
  }

  if (payload.eventType === "UPDATE") {
    return prev.map((o) =>
      o.id === id
        ? {
            ...o,
            status,
            courier_id: (row.courier_id as string | null) ?? o.courier_id,
            ready_at: (row.ready_at as string | null) ?? o.ready_at,
            assignment_escalated_at:
              (row.assignment_escalated_at as string | null) ??
              o.assignment_escalated_at,
          }
        : o,
    );
  }

  return prev;
}

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
  enableRealtime = false,
}: Options) {
  const baselineLogged = useRef(false);
  useEffect(() => {
    if (IS_DEV && !baselineLogged.current) {
      baselineLogged.current = true;
      console.log("[ADMIN SSR ORDERS]", initialOrders.length);
    }
  }, [initialOrders.length]);

  const supabase = useMemo(() => createBrowserClient(), []);
  const statusesRef = useMemo(() => activeStatuses, [activeStatuses.join(",")]);

  const fetchOrders = useCallback(async (): Promise<AdminLiveOrder[]> => {
    const data = await fetchSupabaseList<AdminLiveOrder[]>(
      "ADMIN CLIENT FETCH",
      async () =>
        await supabase
          .from("orders")
          .select(
            `id, status, total_amount, merchant_id, courier_id, created_at, ready_at, assignment_escalated_at,
             ${ORDER_MERCHANT_ADMIN}`,
          )
          .in("status", statusesRef)
          .order("created_at", { ascending: false }),
    );
    if (data === null) {
      throw new Error("ADMIN CLIENT FETCH failed");
    }
    return data;
  }, [supabase, statusesRef]);

  const mergeRow = useCallback(
    (
      prev: AdminLiveOrder[],
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => mergeAdminOrderRow(prev, payload),
    [],
  );

  const { rows, setRows, connectionStatus, refetch } = useOrderRealtimeCore({
    filter: { kind: "admin" },
    initialRows: initialOrders,
    fetchRows: fetchOrders,
    mergeRow,
    preserveSsrBaseline: true,
    enabled: enableRealtime,
  });

  return { orders: rows, setOrders: setRows, connectionStatus, refetch };
}
