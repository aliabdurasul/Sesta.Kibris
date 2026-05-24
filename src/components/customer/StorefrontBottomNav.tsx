"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { storefrontTabs, type StorefrontTab } from "@/lib/ui/nav-config";
import { cn } from "@/lib/ui/cn";

function TabIcon({
  type,
  active,
}: {
  type: StorefrontTab["icon"];
  active: boolean;
}) {
  const stroke = active ? "var(--color-accent-strong)" : "var(--color-text-muted)";
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
    case "orders":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      );
    case "markets":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M3 9l9-6 9 6v11H3z" />
          <path d="M9 22V12h6v10" />
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

function isTabActive(pathname: string, tab: StorefrontTab): boolean {
  if (tab.href === "/") return pathname === "/";
  if (tab.href.startsWith("/#")) {
    return pathname === "/" || pathname.startsWith("/market/");
  }
  return tab.matchPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

const HIDE_NAV_PREFIXES = ["/auth"];

export function StorefrontBottomNav({ ordersHref }: { ordersHref: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  useEffect(() => setMounted(true), []);

  if (HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const tabs = storefrontTabs(ordersHref);

  return (
    <nav
      className="customer-bottom-nav fixed bottom-0 left-0 right-0 z-50"
      aria-label="Müşteri menüsü"
    >
      <div className="customer-bottom-nav-inner">
        <div className="flex items-center justify-between">
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab);
            const showBadge = tab.icon === "cart" && mounted && cartCount > 0;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="relative flex min-w-[3rem] flex-1 flex-col items-center gap-0.5 py-1"
              >
                <TabIcon type={tab.icon} active={active} />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-accent-strong" : "text-text-muted",
                  )}
                >
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
      </div>
    </nav>
  );
}
