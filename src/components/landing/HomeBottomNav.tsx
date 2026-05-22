"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

const TABS = [
  { href: "/", label: "Ana", icon: "home" },
  { href: "/#browse-markets", label: "Keşfet", icon: "search" },
  { href: "/checkout", label: "Sepet", icon: "cart" },
  { href: "/auth/login", label: "Profil", icon: "user" },
] as const;

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const stroke = active ? "#FF6B2C" : "#6B7280";
  const cls = "h-[22px] w-[22px]";
  switch (type) {
    case "cart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M2 4h2l2 14h12l2-10H6" />
        </svg>
      );
    case "search":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
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
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  useEffect(() => setMounted(true), []);

  if (pathname !== "/") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      aria-label="Ana menü"
    >
      <div className="mx-auto max-w-lg rounded-t-[1.5rem] border-t border-border bg-brand-white/90 px-6 pb-5 pt-2.5 shadow-[0_-8px_32px_rgba(16,24,40,0.08)] backdrop-blur-lg">
        <div className="flex items-center justify-between">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : tab.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(tab.href);
            const showBadge =
              tab.icon === "cart" && mounted && cartCount > 0;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="relative flex flex-col items-center gap-0.5 py-1"
              >
                <TabIcon type={tab.icon} active={active} />
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-brand-orange" : "text-text-muted"
                  }`}
                >
                  {tab.label}
                </span>
                {showBadge && (
                  <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
