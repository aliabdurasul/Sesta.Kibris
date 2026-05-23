"use client";

/**
 * Add to cart button — wired to zustand cart store.
 * Used by ProductCard.
 * Shows quantity controls when item is already in cart.
 */
import { useCartStore } from "@/lib/cart-store";

import type { StorefrontProduct } from "@/types/catalog";

interface AddToCartButtonProps {
  product: StorefrontProduct;
  merchantId: string;
  merchantSlug: string;
}

export function AddToCartButton({
  product,
  merchantId,
  merchantSlug,
}: AddToCartButtonProps) {
  const { items, addItem, removeItem, updateQuantity } = useCartStore();
  const existing = items.find((i) => i.productId === product.productId);
  const quantity = existing?.quantity ?? 0;

  if (!product.isAvailable) {
    return (
      <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-400">
        Mevcut değil
      </span>
    );
  }

  if (quantity > 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(product.productId, quantity - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300"
          aria-label="Azalt"
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold text-gray-900">
          {quantity}
        </span>
        <button
          onClick={() =>
            addItem(
              {
                productId: product.productId,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
              },
              merchantId,
              merchantSlug,
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white hover:bg-blue-700 active:bg-blue-800"
          aria-label="Artır"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() =>
        addItem(
          {
            productId: product.productId,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
          },
          merchantId,
          merchantSlug,
        )
      }
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      aria-label={`${product.name} sepete ekle`}
    >
      + Ekle
    </button>
  );
}
