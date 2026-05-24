"use client";

import type { NavItem } from "@/lib/ui/nav-config";

export function ShellNavIcon({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  if (!item.tabIcon) {
    return (
      <span className="text-lg leading-none" aria-hidden>
        {item.icon}
      </span>
    );
  }

  const stroke = active ? "var(--color-accent-strong)" : "var(--color-text-muted)";
  const cls = "h-[22px] w-[22px]";

  switch (item.tabIcon) {
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
