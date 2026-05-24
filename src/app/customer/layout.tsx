/**
 * Customer orders — consumer AppShell (same system as storefront).
 */
export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/layouts/AppShell";
import { consumerNav } from "@/lib/ui/nav-config";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("customer");

  return (
    <AppShell
      context="consumer"
      title="Siparişlerim"
      subtitle={undefined}
      navItems={consumerNav("/customer/orders")}
    >
      {children}
    </AppShell>
  );
}
