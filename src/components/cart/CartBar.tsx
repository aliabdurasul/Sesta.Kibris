"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

export function CartBar({ hideOnHome = false }: { hideOnHome?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const total = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const offset = mounted && itemCount > 0 ? "3.75rem" : "0px";
    document.documentElement.style.setProperty("--cart-pill-offset", offset);
    return () => {
      document.documentElement.style.setProperty("--cart-pill-offset", "0px");
    };
  }, [mounted, itemCount]);

  if (!mounted) return null;
  if (hideOnHome && pathname === "/") return null;
  if (itemCount === 0) return null;

  const totalDisplay = `₺${(total / 100).toFixed(2)}`;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-40 flex justify-center px-3"
      style={{
        bottom: "calc(var(--shell-bottom-nav-h) + 0.5rem)",
      }}
    >
      <Link
        href="/checkout"
        className="pointer-events-auto flex h-14 max-h-16 w-full max-w-md items-center justify-between gap-3 rounded-full bg-brand-navy px-4 py-2.5 text-white shadow-lg ring-1 ring-black/5 transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden>🛒</span>
          <span>
            {itemCount} ürün
          </span>
        </span>
        <span className="text-sm font-bold tabular-nums">{totalDisplay}</span>
        <span className="text-xs font-medium text-white/80" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}
