/**
 * Admin — unified AppShell (operator context).
 */
import { requireRole } from "@/lib/auth";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { AppShell } from "@/components/layouts/AppShell";
import { adminNav } from "@/lib/ui/nav-config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <AppShell
      context="operator"
      title="Yönetim Paneli"
      subtitle="Admin"
      navItems={adminNav()}
      headerActions={
        <SignOutForm buttonClassName="text-sm text-text-muted hover:text-brand-navy">
          Çıkış
        </SignOutForm>
      }
    >
      {children}
    </AppShell>
  );
}
