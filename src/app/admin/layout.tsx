/**
 * Admin layout — desktop-first SaaS dashboard (sidebar + tables).
 */
import { requireRole } from "@/lib/auth";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { adminNavItems } from "@/lib/ui/nav-config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <DashboardShell
      title="Yönetim Paneli"
      subtitle="Admin"
      navItems={adminNavItems()}
      headerActions={
        <SignOutForm buttonClassName="text-sm text-text-muted hover:text-brand-navy">
          Çıkış
        </SignOutForm>
      }
    >
      {children}
    </DashboardShell>
  );
}
