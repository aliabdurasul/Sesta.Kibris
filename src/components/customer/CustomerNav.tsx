"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CustomerNav() {
  const pathname = usePathname();
  const items = [
    { href: "/merchants", label: "Marketler", icon: "🏪" },
    { href: "/customer/orders", label: "Siparişlerim", icon: "📋" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white pb-safe-bottom">
      <div className="flex">
        {items.map((item) => {
          const isActive =
            item.href === "/customer/orders"
              ? pathname.startsWith("/customer/orders")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-center text-xs font-medium transition-colors ${
                isActive ? "text-blue-600" : "text-gray-400"
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
