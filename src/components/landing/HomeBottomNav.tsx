"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

const TABS = [
  { href: "/", label: "Ana Sayfa", icon: "home" },
  { href: "/#categories", label: "Kategoriler", icon: "grid" },
  { href: "/checkout", label: "Sepetim", icon: "cart" },
  { href: "/customer/orders", label: "Siparişlerim", icon: "orders" },
  { href: "/auth/login", label: "Hesabım", icon: "user" },
] as const;

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const stroke = active ? "#FF7A00" : "#6B7280";
  const cls = "h-6 w-6";
  switch (type) {
    case "cart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M2 4h2l2 14h12l2-10H6" />
        </svg>
      );
    case "grid":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "orders":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      );
    case "user":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M4 10l8-6 8 6v10H4z" />
        </svg>
      );
  }
}

export function HomeBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => setMounted(true), []);

  if (pathname !== "/") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      aria-label="Ana menü"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between rounded-[1.75rem] bg-brand-white/95 px-2 py-2 shadow-[0_-4px_32px_rgba(11,42,111,0.12)] ring-1 ring-black/5 backdrop-blur-md">
        {TABS.map((tab) => {
          const isHome = tab.href === "/";
          const active = isHome
            ? pathname === "/"
            : tab.href.startsWith("/#")
              ? false
              : pathname.startsWith(tab.href.split("#")[0]!);
          const showBadge = tab.icon === "cart" && mounted && cartCount > 0;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors ${
                active ? "text-brand-orange" : "text-text-muted"
              }`}
            >
              <TabIcon type={tab.icon} active={active} />
              <span className={`text-[10px] font-semibold ${active ? "text-brand-navy" : ""}`}>
                {tab.label}
              </span>
              {showBadge && (
                <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
