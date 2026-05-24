/**
 * Mobile-first customer marketplace shell.
 * Max 480px centered column, sticky bottom navigation.
 */
import { StorefrontBottomNav } from "@/components/customer/StorefrontBottomNav";
import { CartBar } from "@/components/cart/CartBar";

export function CustomerShell({
  children,
  ordersHref,
  hideBottomNav,
}: {
  children: React.ReactNode;
  ordersHref: string;
  hideBottomNav?: boolean;
}) {
  return (
    <div className="customer-app min-h-screen bg-app-bg font-sans text-text-primary">
      <main className="customer-main">{children}</main>
      {!hideBottomNav && <StorefrontBottomNav ordersHref={ordersHref} />}
      <CartBar hideOnHome />
    </div>
  );
}
