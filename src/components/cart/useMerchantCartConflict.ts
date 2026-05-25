"use client";

import { useCallback, useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

/**
 * Shows merchant switch modal when landing on a market page with another merchant's cart.
 */
export function useMerchantCartConflict(merchantId: string) {
  const cartMerchantId = useCartStore((s) => s.merchantId);
  const itemCount = useCartStore((s) => s.items.length);
  const clearCart = useCartStore((s) => s.clearCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      cartMerchantId !== null &&
      cartMerchantId !== merchantId &&
      itemCount > 0
    ) {
      setOpen(true);
    }
  }, [merchantId, cartMerchantId, itemCount]);

  const dismiss = useCallback(() => setOpen(false), []);

  const continueSwitch = useCallback(() => {
    clearCart();
    setOpen(false);
  }, [clearCart]);

  return { open, dismiss, continueSwitch };
}
