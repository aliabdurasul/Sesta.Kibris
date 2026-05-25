"use client";

import { useState } from "react";
import { MerchantCartSwitchModal } from "@/components/cart/MerchantCartSwitchModal";
import { useCartStore } from "@/lib/cart-store";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";
import type { StorefrontProduct } from "@/types/catalog";
import { cn } from "@/lib/ui/cn";

interface AddToCartButtonProps {
  product: StorefrontProduct;
  merchantId: string;
  merchantSlug: string;
  compact?: boolean;
}

export function AddToCartButton({
  product,
  merchantId,
  merchantSlug,
  compact = false,
}: AddToCartButtonProps) {
  const quantity = useCartStore(
    (s) => s.items.find((i) => i.productId === product.productId)?.quantity ?? 0,
  );
  const addItem = useCartStore((s) => s.addItem);
  const replaceMerchantAndAddItem = useCartStore((s) => s.replaceMerchantAndAddItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const [switchOpen, setSwitchOpen] = useState(false);

  const cartItem = {
    productId: product.productId,
    name: product.name,
    price: product.price,
    imageUrl: sanitizeProductImageUrl(product.imageUrl),
  };

  const performAdd = (replace: boolean) => {
    if (replace) {
      replaceMerchantAndAddItem(cartItem, merchantId, merchantSlug);
    } else {
      const result = addItem(cartItem, merchantId, merchantSlug);
      if (!result.ok && result.reason === "merchant_conflict") {
        setSwitchOpen(true);
      }
    }
  };

  const btnBase = compact
    ? "flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-bold transition-transform active:scale-95"
    : "flex h-9 min-w-9 items-center justify-center rounded-lg text-base font-bold";

  if (!product.isAvailable) {
    return (
      <span className="text-[10px] font-medium text-gray-400">Yok</span>
    );
  }

  if (quantity > 0) {
    return (
      <>
        <div
          className={cn(
            "inline-flex items-center gap-0.5",
            compact &&
              "rounded-full bg-accent-soft pl-0.5 pr-0.5 ring-1 ring-accent-strong/25",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => updateQuantity(product.productId, quantity - 1)}
            className={cn(
              btnBase,
              compact
                ? "h-7 w-7 text-accent-strong hover:bg-white/60"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
            aria-label="Azalt"
          >
            −
          </button>
          <span
            className={cn(
              "min-w-[1.25rem] text-center font-semibold tabular-nums",
              compact ? "text-xs text-gray-900" : "text-sm text-gray-900",
            )}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => performAdd(false)}
            className={cn(
              btnBase,
              compact
                ? "h-7 w-7 bg-accent-strong text-white shadow-sm"
                : "bg-accent-strong text-white hover:bg-accent-strong/90",
            )}
            aria-label="Artır"
          >
            +
          </button>
        </div>
        <MerchantCartSwitchModal
          open={switchOpen}
          onCancel={() => setSwitchOpen(false)}
          onContinue={() => {
            setSwitchOpen(false);
            performAdd(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          performAdd(false);
        }}
        className={cn(
          btnBase,
          compact
            ? "h-7 w-7 bg-accent-strong text-white shadow-sm hover:bg-accent-strong/90"
            : "rounded-lg bg-accent-strong px-3 py-1.5 text-sm font-semibold text-white",
        )}
        aria-label={`${product.name} sepete ekle`}
      >
        +
      </button>
      <MerchantCartSwitchModal
        open={switchOpen}
        onCancel={() => setSwitchOpen(false)}
        onContinue={() => {
          setSwitchOpen(false);
          performAdd(true);
        }}
      />
    </>
  );
}
