/**
 * Desktop-first SaaS dashboard shell — merchant & admin.
 * Sidebar on md+, card fallback hint on mobile via dashboard-mobile-stack.
 */
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import type { DashboardNavItem } from "@/lib/ui/nav-config";

export function DashboardShell({
  title,
  subtitle,
  navItems,
  headerActions,
  children,
}: {
  title: string;
  subtitle?: string;
  navItems: DashboardNavItem[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-app flex min-h-screen bg-app-bg">
      <DashboardSidebar title={title} subtitle={subtitle} items={navItems} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DashboardMobileHeader
          title={title}
          subtitle={subtitle}
          items={navItems}
          actions={headerActions}
        />

        <header className="dashboard-topbar hidden border-b border-border bg-brand-white px-6 py-4 md:flex">
          <div className="flex w-full items-center justify-between">
            <div>
              {subtitle && (
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {subtitle}
                </p>
              )}
              <h1 className="text-lg font-bold text-brand-navy">{title}</h1>
            </div>
            {headerActions && (
              <div className="flex items-center gap-3">{headerActions}</div>
            )}
          </div>
        </header>

        <main className="dashboard-main flex-1 overflow-x-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className ?? "text-sm font-medium text-accent-strong hover:underline"}
    >
      {children}
    </Link>
  );
}
