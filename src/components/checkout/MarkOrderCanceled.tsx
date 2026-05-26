"use client";

import { useEffect } from "react";

/** Notify server when customer cancels Stripe Checkout. */
export function MarkOrderCanceled({ orderId }: { orderId: string | null }) {
  useEffect(() => {
    if (!orderId) return;
    void fetch("/api/orders/cancel-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
  }, [orderId]);

  return null;
}
