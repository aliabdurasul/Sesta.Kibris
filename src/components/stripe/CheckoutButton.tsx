"use client";

/**
 * Starts Hosted Checkout — server creates order + Stripe Session, then redirects.
 */
import { useState } from "react";

export function CheckoutButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe_product_id: productId, quantity: 1 }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Ödeme başlatılamadı");
      }
      window.location.href = json.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ödeme başlatılamadı");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleBuy()}
      className="rounded-full bg-accent-strong px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      {loading ? "…" : "Satın al"}
    </button>
  );
}
