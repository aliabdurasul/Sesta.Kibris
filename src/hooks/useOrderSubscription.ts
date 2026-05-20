/**
 * useOrderSubscription — Supabase Realtime hook for the merchant order queue.
 *
 * Subscribes to postgres_changes on the orders table filtered by merchant_id.
 * Refetches the full order list on reconnect to catch any missed events.
 * Unsubscribes on unmount.
 *
 * Subscription filter: merchant_id=eq.{merchantId}
 * Events: INSERT, UPDATE (status changes, courier assignment, etc.)
 *
 * Connection states:
 *   "connecting" — initial state
 *   "connected"  — subscription confirmed by Supabase
 *   "reconnecting" — lost connection, retrying
 *   "error"      — failed to subscribe
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const DEFAULT_ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "READY"];

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "ASSIGNED"
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
  /** Active statuses to keep in the queue — defaults to PENDING/CONFIRMED/READY */
  activeStatuses?: OrderStatus[];
}

export function useOrderSubscription({
  merchantId,
  initialOrders,
  activeStatuses = DEFAULT_ACTIVE_STATUSES,
}: UseOrderSubscriptionOptions) {
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createBrowserClient());
  // Keep a ref to activeStatuses so fetchOrders can always read the latest
  // value without being listed as a useCallback dependency. This prevents
  // the default-array identity problem from cascading into subscription churn.
  const activeStatusesRef = useRef(activeStatuses);
  activeStatusesRef.current = activeStatuses;

  const fetchOrders = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("orders")
      .select("id, status, total_amount, delivery_address, customer_notes, created_at, order_items(id, quantity, unit_price, product_name, line_total)")
      .eq("merchant_id", merchantId)
      .in("status", activeStatusesRef.current)
      .order("created_at", { ascending: true });

    if (data) {
      setOrders(data as LiveOrder[]);
    }
  }, [merchantId]); // stable — merchantId is the only dependency that should re-subscribe

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Clean up any existing subscription first
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`merchant-orders-${merchantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        async () => {
          // Refetch on any change — simpler and more reliable than diffing events
          await fetchOrders();
        },
      )
      .on("system", { event: "connected" }, () => {
        setStatus("connected");
        // Refetch on reconnect to catch any missed events
        void fetchOrders();
      })
      .on("system", { event: "disconnected" }, () => {
        setStatus("reconnecting");
      })
      .subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          setStatus("connected");
        } else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [merchantId, fetchOrders]);

  return { orders, setOrders, connectionStatus: status };
}
