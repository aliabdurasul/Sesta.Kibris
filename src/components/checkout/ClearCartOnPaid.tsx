"use client";

/**
 * Clears the cart once Stripe payment is confirmed (success page).
 */
import { useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";

export function ClearCartOnPaid({ paymentStatus }: { paymentStatus: string | null }) {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (paymentStatus === "paid") {
      clearCart();
    }
  }, [paymentStatus, clearCart]);

  return null;
}
