/**
 * useCourierSubscription — Supabase Realtime hook for the courier delivery queue.
 *
 * Subscribes to postgres_changes on the orders table filtered by courier_id.
 * Refetches on reconnect to catch any missed events.
 * Unsubscribes on unmount.
 *
 * Subscription filter: courier_id=eq.{courierId}
 * Shows: ASSIGNED and IN_TRANSIT orders only
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

export interface LiveDelivery {
  id: string;
  status: "ASSIGNED" | "IN_TRANSIT";
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

interface UseCourierSubscriptionOptions {
  courierId: string;
  initialOrders: LiveDelivery[];
}

export function useCourierSubscription({
  courierId,
  initialOrders,
}: UseCourierSubscriptionOptions) {
  const [orders, setOrders] = useState<LiveDelivery[]>(initialOrders);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createBrowserClient());

  const fetchOrders = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("orders")
      .select(
        "id, status, total_amount, delivery_address, customer_notes, created_at, merchants(name, address, phone), order_items(id, quantity, product_name, line_total)",
      )
      .eq("courier_id", courierId)
      .in("status", ["ASSIGNED", "IN_TRANSIT"])
      .order("created_at", { ascending: true });

    if (data) {
      setOrders(data as LiveDelivery[]);
    }
  }, [courierId]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`courier-deliveries-${courierId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `courier_id=eq.${courierId}`,
        },
        async () => {
          await fetchOrders();
        },
      )
      .on("system", { event: "connected" }, () => {
        setStatus("connected");
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
  }, [courierId, fetchOrders]);

  return { orders, setOrders, connectionStatus: status };
}
