import { AppShellChrome } from "@/components/layouts/AppShellChrome";
import { UiProvider } from "@/components/layouts/UiProvider";
import type { UiContext } from "@/lib/ui/context";
import type { NavItem } from "@/lib/ui/nav-config";

export function AppShell({
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
  return (
    <UiProvider context={context}>
      <AppShellChrome
        context={context}
        title={title}
        subtitle={subtitle}
        navItems={navItems}
        headerActions={headerActions}
        hideBottomNav={hideBottomNav}
        showCartBar={showCartBar ?? context === "consumer"}
      >
        {children}
      </AppShellChrome>
    </UiProvider>
  );
}

export { PageHeader as DashboardPageHeader } from "@/components/adaptive/PageHeader";
