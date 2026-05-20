"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/merchant", label: "Siparişler", icon: "📋", matchPrefix: "/merchants/" },
  { href: "/merchant/products", label: "Ürünler", icon: "🍽️", matchPrefix: "/merchant/products" },
] as const;

export function MerchantNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white pb-safe-bottom">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/merchant"
              ? pathname === "/merchant" || pathname.startsWith(item.matchPrefix)
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-center text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
