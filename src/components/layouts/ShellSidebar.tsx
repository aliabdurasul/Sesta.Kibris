"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/ui/nav-config";
import { isNavItemActive } from "@/lib/ui/nav-utils";
import { ShellNavIcon } from "@/components/layouts/ShellNavIcons";
import { cn } from "@/lib/ui/cn";

export function ShellSidebar({
  title,
  subtitle,
  items,
  open,
  onClose,
}: {
  title: string;
  subtitle?: string;
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-brand-navy/40 backdrop-blur-sm md:block lg:hidden"
          aria-label="Menüyü kapat"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "shell-sidebar z-50 flex w-[var(--shell-sidebar-w)] shrink-0 flex-col border-r border-border bg-brand-white",
          "hidden md:flex",
          "fixed inset-y-0 left-0 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Ana menü"
      >
        <div className="border-b border-border px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
            SestaKıbrıs
          </p>
          <p className="mt-1 truncate text-sm font-bold text-brand-navy">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent-strong"
                    : "text-text-secondary hover:bg-app-bg",
                )}
              >
                <ShellNavIcon item={item} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
