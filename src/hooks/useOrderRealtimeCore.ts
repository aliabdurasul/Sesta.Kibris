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

const IS_DEV = process.env.NODE_ENV === "development";

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
  /**
   * When true: never auto-refetch on connect/visible; never replace non-empty
   * SSR baseline with an empty client fetch result.
   */
  preserveSsrBaseline?: boolean;
  /** When false: SSR-only — no channel, no refetch (admin stabilization). */
  enabled?: boolean;
}

function applyRowsUpdate<T>(
  prev: T[],
  next: T[],
  preserveSsrBaseline: boolean,
  label: string,
): T[] {
  if (!preserveSsrBaseline) {
    return next;
  }
  if (next.length === 0 && prev.length > 0) {
    if (IS_DEV) {
      console.warn(
        `[${label}] client fetch returned empty — keeping SSR baseline (${prev.length} rows)`,
      );
    }
    return prev;
  }
  return next;
}

export function useOrderRealtimeCore<T extends { id: string }>({
  filter,
  initialRows,
  fetchRows,
  mergeRow,
  getRowId = (r) => r.id,
  preserveSsrBaseline = false,
  enabled = true,
}: UseOrderRealtimeCoreOptions<T>) {
  const [rows, setRows] = useState<T[]>(initialRows);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createBrowserClient());
  const fetchRef = useRef(fetchRows);
  fetchRef.current = fetchRows;
  const logLabel =
    filter.kind === "admin"
      ? "ADMIN REALTIME"
      : filter.kind === "merchant"
        ? "MERCHANT REALTIME"
        : "COURIER REALTIME";

  const refetch = useCallback(async () => {
    try {
      const data = await fetchRef.current();
      setRows((prev) =>
        applyRowsUpdate(prev, data, preserveSsrBaseline, logLabel),
      );
      if (IS_DEV) {
        console.log(`[ADMIN CLIENT FETCH]`, data?.length ?? 0);
      }
    } catch (err) {
      if (IS_DEV) {
        console.error(`[${logLabel}] refetch failed — keeping previous rows`, err);
      }
    }
  }, [preserveSsrBaseline, logLabel]);

  const initialKeyRef = useRef(initialRows.map((r) => r.id).join(","));
  useEffect(() => {
    const key = initialRows.map((r) => r.id).join(",");
    if (key !== initialKeyRef.current) {
      initialKeyRef.current = key;
      setRows((prev) =>
        applyRowsUpdate(prev, initialRows, preserveSsrBaseline, "SSR SYNC"),
      );
    }
  }, [initialRows, preserveSsrBaseline]);

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus("connected");
      return;
    }

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
        if (IS_DEV && filter.kind === "admin") {
          console.log("[ADMIN REALTIME EVENT]", payload.eventType, payload.new);
        }
        if (mergeRow) {
          setRows((prev) => {
            const next = mergeRow(prev, payload);
            return next ?? prev;
          });
        } else if (!preserveSsrBaseline) {
          void refetch();
        }
      })
      .on("system", { event: "connected" }, () => {
        setConnectionStatus("connected");
        if (!preserveSsrBaseline) {
          void refetch();
        }
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
      if (document.visibilityState === "visible" && !preserveSsrBaseline) {
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
    preserveSsrBaseline,
    enabled,
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
        return dedupeById(
          applyRowsUpdate(prev, next, preserveSsrBaseline, logLabel),
        );
      });
    },
    [dedupeById, preserveSsrBaseline, logLabel],
  );

  return {
    rows,
    setRows: setRowsDeduped,
    connectionStatus,
    refetch,
  };
}
