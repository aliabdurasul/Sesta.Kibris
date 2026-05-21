/**
 * Shared Supabase Realtime subscription for orders table.
 * Named channels: orders:admin | orders:merchant:{id} | orders:courier:{id}
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

export type OrderRealtimeFilter =
  | { kind: "admin" }
  | { kind: "merchant"; merchantId: string }
  | { kind: "courier"; courierId: string };

export function orderRealtimeChannelName(filter: OrderRealtimeFilter): string {
  switch (filter.kind) {
    case "admin":
      return "orders:admin";
    case "merchant":
      return `orders:merchant:${filter.merchantId}`;
    case "courier":
      return `orders:courier:${filter.courierId}`;
  }
}

function postgresFilter(filter: OrderRealtimeFilter): string | undefined {
  switch (filter.kind) {
    case "admin":
      return undefined;
    case "merchant":
      return `merchant_id=eq.${filter.merchantId}`;
    case "courier":
      return `courier_id=eq.${filter.courierId}`;
  }
}

interface UseOrderRealtimeCoreOptions<T> {
  filter: OrderRealtimeFilter;
  initialRows: T[];
  fetchRows: () => Promise<T[]>;
  /** Merge a single realtime row into list; return null to remove */
  mergeRow?: (
    rows: T[],
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ) => T[] | null;
  getRowId?: (row: T) => string;
}

export function useOrderRealtimeCore<T extends { id: string }>({
  filter,
  initialRows,
  fetchRows,
  mergeRow,
  getRowId = (r) => r.id,
}: UseOrderRealtimeCoreOptions<T>) {
  const [rows, setRows] = useState<T[]>(initialRows);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createBrowserClient());
  const fetchRef = useRef(fetchRows);
  fetchRef.current = fetchRows;

  const refetch = useCallback(async () => {
    const data = await fetchRef.current();
    setRows(data);
  }, []);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channelName = orderRealtimeChannelName(filter);
    const pgFilter = postgresFilter(filter);

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const changeConfig: {
      event: "*";
      schema: "public";
      table: "orders";
      filter?: string;
    } = {
      event: "*",
      schema: "public",
      table: "orders",
    };
    if (pgFilter) changeConfig.filter = pgFilter;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", changeConfig, (payload) => {
        if (mergeRow) {
          setRows((prev) => {
            const next = mergeRow(prev, payload);
            return next ?? prev;
          });
        } else {
          void refetch();
        }
      })
      .on("system", { event: "connected" }, () => {
        setConnectionStatus("connected");
        void refetch();
      })
      .on("system", { event: "disconnected" }, () => {
        setConnectionStatus("reconnecting");
      })
      .subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") {
          setConnectionStatus("error");
        }
      });

    channelRef.current = channel;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    filter.kind,
    filter.kind === "merchant"
      ? filter.merchantId
      : filter.kind === "courier"
        ? filter.courierId
        : "admin",
    mergeRow,
    refetch,
  ]);

  const dedupeById = useCallback(
    (list: T[]) => {
      const seen = new Set<string>();
      return list.filter((r) => {
        const id = getRowId(r);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
    [getRowId],
  );

  const setRowsDeduped = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setRows((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return dedupeById(next);
      });
    },
    [dedupeById],
  );

  return {
    rows,
    setRows: setRowsDeduped,
    connectionStatus,
    refetch,
  };
}
