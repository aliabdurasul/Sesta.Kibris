"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

export function CartBar({ hideOnHome = false }: { hideOnHome?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { getTotal, getItemCount } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (hideOnHome && pathname === "/") return null;

  const count = getItemCount();
  if (count === 0) return null;

  const total = getTotal();
  const totalDisplay = `${(total / 100).toFixed(2)} ₺`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-20">
      <Link
        href="/checkout"
        className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-brand-navy px-5 py-3.5 text-white shadow-lg"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
          {count}
        </span>
        <span className="font-semibold">Sepeti Görüntüle</span>
        <span className="font-bold">{totalDisplay}</span>
      </Link>
    </div>
  );
}
