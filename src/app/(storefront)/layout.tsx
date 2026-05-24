/**
 * Customer marketplace layout — mobile-first, max 480px, bottom nav on all pages.
 */
import { CustomerShell } from "@/components/layouts/CustomerShell";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const ordersHref = session
    ? "/customer/orders"
    : "/orders/guest";

  return <CustomerShell ordersHref={ordersHref}>{children}</CustomerShell>;
}
