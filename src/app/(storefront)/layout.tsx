/**
 * Storefront — unified AppShell (consumer context).
 */
import { AppShell } from "@/components/layouts/AppShell";
import { getSession } from "@/lib/auth";
import { consumerNav } from "@/lib/ui/nav-config";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const ordersHref = session ? "/customer/orders" : "/orders/guest";

  return (
    <AppShell
      context="consumer"
      title="SestaKıbrıs"
      subtitle="Marketplace"
      navItems={consumerNav(ordersHref)}
      showCartBar
    >
      {children}
    </AppShell>
  );
}
