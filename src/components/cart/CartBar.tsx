"use client";

/**
 * Cart summary bar — sticky bottom of storefront pages.
 * Visible only when cart has items.
 * Links to /checkout.
 */
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

export function CartBar() {
  const { items, getTotal, getItemCount } = useCartStore();
  const count = getItemCount();

  if (count === 0) return null;

  const total = getTotal();
  const totalDisplay = `${(total / 100).toFixed(2)} ₺`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe-bottom">
      <Link
        href="/checkout"
        className="flex items-center justify-between rounded-2xl bg-blue-600 px-5 py-4 text-white shadow-lg"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm font-bold">
          {count}
        </span>
        <span className="font-semibold">Sepeti Görüntüle</span>
        <span className="font-bold">{totalDisplay}</span>
      </Link>
    </div>
  );
}
