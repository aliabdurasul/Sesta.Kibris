"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { NavItem } from "@/lib/ui/nav-config";
import { isNavItemActive } from "@/lib/ui/nav-utils";
import { ShellNavIcon } from "@/components/layouts/ShellNavIcons";
import { cn } from "@/lib/ui/cn";

const HIDE_NAV_PREFIXES = ["/auth"];

export function ShellBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  useEffect(() => setMounted(true), []);

  if (HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav
      className="shell-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Alt menü"
    >
      <div className="shell-bottom-nav-inner mx-auto w-full max-w-[var(--content-max-consumer)]">
        <div className="flex items-center justify-between border-t border-border bg-brand-white/95 px-4 pb-5 pt-2.5 shadow-[0_-4px_24px_rgba(16,24,40,0.06)] backdrop-blur-md">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item);
            const showBadge =
              item.showCartBadge && mounted && cartCount > 0;

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="relative flex min-w-[3rem] flex-1 flex-col items-center gap-0.5 py-1"
              >
                <ShellNavIcon item={item} active={active} />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-accent-strong" : "text-text-muted",
                  )}
                >
                  {item.label}
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
