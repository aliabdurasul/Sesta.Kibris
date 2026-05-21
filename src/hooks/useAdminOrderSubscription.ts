/**
 * useAdminOrderSubscription — Realtime for admin order assignment board.
 * Channel: orders:admin (no postgres filter — RLS limits visible rows)
 */
"use client";

import { useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useOrderRealtimeCore, type ConnectionStatus } from "@/hooks/useOrderRealtimeCore";

export type { ConnectionStatus };

export interface AdminLiveOrder {
  id: string;
  status: string;
  total_amount: number;
  merchant_id: string;
  courier_id: string | null;
  created_at: string;
  merchants: { name: string } | null;
}

interface Options {
  initialOrders: AdminLiveOrder[];
  /** Statuses shown on assignment board */
  activeStatuses?: string[];
}

const DEFAULT_STATUSES = ["READY", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export function useAdminOrderSubscription({
  initialOrders,
  activeStatuses = DEFAULT_STATUSES,
}: Options) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const statusesRef = useMemo(() => activeStatuses, [activeStatuses.join(",")]);

  const fetchOrders = useCallback(async (): Promise<AdminLiveOrder[]> => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total_amount, merchant_id, courier_id, created_at, merchants(name)")
      .in("status", statusesRef)
      .order("created_at", { ascending: false });
    return (data ?? []) as AdminLiveOrder[];
  }, [supabase, statusesRef]);

  const { rows, setRows, connectionStatus, refetch } = useOrderRealtimeCore({
    filter: { kind: "admin" },
    initialRows: initialOrders,
    fetchRows: fetchOrders,
  });

  return { orders: rows, setOrders: setRows, connectionStatus, refetch };
}
