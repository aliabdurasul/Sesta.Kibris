"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { DashboardNavItem } from "@/lib/ui/nav-config";
import { cn } from "@/lib/ui/cn";

export function DashboardMobileHeader({
  title,
  subtitle,
  items,
  actions,
}: {
  title: string;
  subtitle?: string;
  items: DashboardNavItem[];
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-brand-white md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary ring-1 ring-border"
          aria-expanded={open}
          aria-label="Menü"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0 flex-1 px-3 text-center">
          <p className="truncate text-sm font-bold text-brand-navy">{title}</p>
          {subtitle && (
            <p className="truncate text-[10px] text-text-muted">{subtitle}</p>
          )}
        </div>
        {actions ?? <div className="w-9" />}
      </div>
      {open && (
        <nav className="border-t border-border bg-brand-white px-2 py-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active ? "bg-accent-soft text-accent-strong" : "text-text-secondary",
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
