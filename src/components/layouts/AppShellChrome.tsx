"use client";

import { useState } from "react";
import { CartBar } from "@/components/cart/CartBar";
import { ShellBottomNav } from "@/components/layouts/ShellBottomNav";
import { ShellMain } from "@/components/layouts/ShellMain";
import { ShellSidebar } from "@/components/layouts/ShellSidebar";
import { ShellTopBar } from "@/components/layouts/ShellTopBar";
import type { UiContext } from "@/lib/ui/context";
import type { NavItem } from "@/lib/ui/nav-config";
import { cn } from "@/lib/ui/cn";

export function AppShellChrome({
  context,
  title,
  subtitle,
  navItems,
  headerActions,
  hideBottomNav,
  showCartBar,
  children,
}: {
  context: UiContext;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  headerActions?: React.ReactNode;
  hideBottomNav?: boolean;
  showCartBar?: boolean;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isConsumer = context === "consumer";

  return (
    <div
      className={cn(
        "app-shell min-h-[100dvh] bg-app-bg font-sans text-text-primary",
        isConsumer ? "app-shell--consumer" : "app-shell--with-sidebar",
      )}
    >
      {!isConsumer && (
        <ShellSidebar
          title={title}
          subtitle={subtitle}
          items={navItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-shell-body flex min-h-[100dvh] min-w-0 flex-col">
        {!isConsumer && (
          <ShellTopBar
            title={title}
            subtitle={subtitle}
            headerActions={headerActions}
            onMenuOpen={() => setSidebarOpen(true)}
          />
        )}
        <ShellMain context={context}>{children}</ShellMain>
      </div>

      {!hideBottomNav && <ShellBottomNav items={navItems} />}
      {showCartBar && <CartBar hideOnHome />}
    </div>
  );
}
