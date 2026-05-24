"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/lib/ui/nav-config";
import { cn } from "@/lib/ui/cn";

function isNavActive(pathname: string, item: DashboardNavItem): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }
  return item.matchPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function DashboardSidebar({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: DashboardNavItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar hidden w-60 shrink-0 flex-col border-r border-border bg-brand-white md:flex">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
          SestaKıbrıs
        </p>
        <p className="mt-1 truncate text-sm font-bold text-brand-navy">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Dashboard">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-text-secondary hover:bg-app-bg",
              )}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
